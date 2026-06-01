from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload
from decimal import Decimal
from datetime import datetime

from api.v1.dependencies import get_current_user, get_current_admin
from api.v1.schemas.order import (
    OrderCreateRequest,
    OrderConfirmPaymentRequest,
    OrderResponse,
    OrderAdminResponse,
)
from database.db import get_db
from models.order import Order, OrderItem
from models.payment_settings import PaymentSettings
from models.product import Product
from models.user import User

router = APIRouter(prefix="/orders", tags=["orders"])

ORDER_STATUS_PENDING = "pending_payment"
ORDER_STATUS_REPORTED = "payment_reported"
ORDER_STATUS_PAID = "paid"
ORDER_STATUS_CANCELLED = "cancelled"


def _to_decimal(value: Decimal | int | float) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _unit_price(product: Product) -> Decimal:
    return _to_decimal(product.discount_price or product.price)


def _recalculate_available(product: Product) -> None:
    product.available_stock = max(0, product.stock - product.reserved_stock)


def _build_pix_txid(order_id: int) -> str:
    return f"SCARFSTORE{order_id}"[:25].upper()


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(PaymentSettings).first()
    pix_key = settings.phone_number if settings and settings.phone_number else None
    if not pix_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pagamento PIX nao configurado",
        )

    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Informe ao menos um item")

    items_map: dict[int, int] = {}
    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantidade invalida")
        items_map[item.product_id] = items_map.get(item.product_id, 0) + item.quantity

    product_ids = list(items_map.keys())
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()

    if len(products) != len(product_ids):
        missing = sorted(set(product_ids) - {p.id for p in products})
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produtos nao encontrados: {missing}",
        )

    total_amount = Decimal("0.00")
    line_items: list[OrderItem] = []

    for product in products:
        _recalculate_available(product)
        qty = items_map[product.id]
        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Produto indisponivel: {product.name}",
            )
        if product.available_stock < qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estoque insuficiente para {product.name}",
            )

        unit_price = _unit_price(product)
        total_price = (unit_price * qty).quantize(Decimal("0.01"))
        total_amount += total_price

        line_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                unit_price=unit_price,
                quantity=qty,
                total_price=total_price,
            )
        )

    order = Order(
        user_id=current_user.id,
        status=ORDER_STATUS_PENDING,
        payment_method=(payload.payment_method or "pix"),
        total_amount=total_amount.quantize(Decimal("0.01")),
        pix_key=pix_key,
    )
    db.add(order)
    db.flush()

    order.pix_txid = _build_pix_txid(order.id)

    for item in line_items:
        item.order_id = order.id
        db.add(item)

    for product in products:
        qty = items_map[product.id]
        product.reserved_stock += qty
        _recalculate_available(product)

    db.commit()
    db.refresh(order)

    order = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.id == order.id)
        .first()
    )

    return order


@router.get("/me", response_model=list[OrderResponse])
async def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return orders


@router.get("/admin", response_model=list[OrderAdminResponse])
async def list_all_orders(
    status_filter: str | None = Query(None, alias="status"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Order).options(selectinload(Order.items), selectinload(Order.user))
    if status_filter:
        query = query.filter(Order.status == status_filter)
    return query.order_by(Order.created_at.desc()).all()


@router.post("/{order_id}/confirm-payment", response_model=OrderResponse)
async def confirm_payment(
    order_id: int,
    payload: OrderConfirmPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido nao encontrado")

    if order.status == ORDER_STATUS_PAID:
        return order
    if order.status == ORDER_STATUS_CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pedido cancelado")

    reference = payload.reference.strip()
    if not reference:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referencia obrigatoria")

    order.status = ORDER_STATUS_REPORTED
    order.payment_reported_at = datetime.utcnow()
    order.payment_reference = reference
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/mark-paid", response_model=OrderAdminResponse)
async def mark_paid(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    order = (
        db.query(Order)
        .options(selectinload(Order.items), selectinload(Order.user))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido nao encontrado")

    if order.status == ORDER_STATUS_CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pedido cancelado")
    if order.status == ORDER_STATUS_PAID:
        return order

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue
        product.stock = max(0, product.stock - item.quantity)
        product.reserved_stock = max(0, product.reserved_stock - item.quantity)
        _recalculate_available(product)

    order.status = ORDER_STATUS_PAID
    order.paid_at = datetime.utcnow()

    db.commit()
    db.refresh(order)
    return order
