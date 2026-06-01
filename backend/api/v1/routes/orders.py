from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload
from decimal import Decimal
from datetime import datetime

from api.v1.dependencies import get_current_user, get_current_admin
from api.v1.schemas.address import ShippingAddress
from api.v1.schemas.address import apply_shipping_to_order
from api.v1.schemas.order import (
    OrderCreateRequest,
    OrderConfirmPaymentRequest,
    OrderMarkDeliveredRequest,
    OrderResponse,
    OrderAdminResponse,
    OrderStatus,
    PurchaseTermsResponse,
)
from config.purchase_terms import (
    PURCHASE_TERMS_TITLE,
    build_clauses,
    build_summary,
    normalize_delivery_days,
    terms_version_for_days,
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
ORDER_STATUS_DELIVERED = "delivered"
ORDER_STATUS_CANCELLED = "cancelled"

def _delivery_days_from_settings(db: Session) -> int:
    settings = db.query(PaymentSettings).first()
    raw = settings.delivery_commitment_days if settings else None
    return normalize_delivery_days(raw)


@router.get("/purchase-terms", response_model=PurchaseTermsResponse)
async def get_purchase_terms(db: Session = Depends(get_db)):
    days = _delivery_days_from_settings(db)
    return PurchaseTermsResponse(
        version=terms_version_for_days(days),
        title=PURCHASE_TERMS_TITLE,
        summary=build_summary(days),
        clauses=build_clauses(days),
        delivery_commitment_days=days,
    )


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

    if not payload.accept_terms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aceite o Termo de Compra e Garantia de Entrega para continuar",
        )
    days = _delivery_days_from_settings(db)
    expected_terms_version = terms_version_for_days(days)
    if payload.terms_version != expected_terms_version:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Versao dos termos desatualizada. Atualize a pagina e tente novamente",
        )

    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Informe ao menos um item")

    items_map: dict[int, int] = {}
    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantidade invalida")
        items_map[item.product_id] = items_map.get(item.product_id, 0) + item.quantity

    product_ids = list(items_map.keys())
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .order_by(Product.id)
        .with_for_update()
        .all()
    )

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
        buyer_username=current_user.username,
        buyer_email=current_user.email,
        status=ORDER_STATUS_PENDING,
        payment_method=(payload.payment_method or "pix"),
        total_amount=total_amount.quantize(Decimal("0.01")),
        pix_key=pix_key,
        terms_version=expected_terms_version,
        terms_accepted_at=datetime.utcnow(),
    )
    apply_shipping_to_order(order, payload.shipping_address)
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
        .options(selectinload(Order.items), selectinload(Order.user))
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
    status_filter: OrderStatus | None = Query(None, alias="status"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Order).options(selectinload(Order.items), selectinload(Order.user))
    if status_filter:
        query = query.filter(Order.status == status_filter)
    return query.order_by(Order.created_at.desc()).all()


def _release_order_reservations(order: Order, db: Session) -> None:
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue
        product.reserved_stock = max(0, product.reserved_stock - item.quantity)
        _recalculate_available(product)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido nao encontrado")

    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")

    if order.status in (ORDER_STATUS_PAID, ORDER_STATUS_DELIVERED):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pedido ja pago ou entregue")
    if order.status == ORDER_STATUS_CANCELLED:
        return order

    _release_order_reservations(order, db)
    order.status = ORDER_STATUS_CANCELLED
    db.commit()
    db.refresh(order)
    return order


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

    if order.status in (ORDER_STATUS_PAID, ORDER_STATUS_DELIVERED):
        return order
    if order.status == ORDER_STATUS_CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pedido cancelado")
    if order.status == ORDER_STATUS_REPORTED:
        return order

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
    if order.status in (ORDER_STATUS_PAID, ORDER_STATUS_DELIVERED):
        return order

    if order.status != ORDER_STATUS_REPORTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pedido deve ter pagamento informado antes da confirmacao",
        )

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Produto {item.product_id} nao encontrado para baixa de estoque",
            )
        if product.reserved_stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Reserva insuficiente para {product.name}",
            )
        product.stock = max(0, product.stock - item.quantity)
        product.reserved_stock = max(0, product.reserved_stock - item.quantity)
        _recalculate_available(product)

    order.status = ORDER_STATUS_PAID
    order.paid_at = datetime.utcnow()
    order.paid_by_admin_id = current_admin.id

    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/mark-delivered", response_model=OrderAdminResponse)
async def mark_delivered(
    order_id: int,
    payload: OrderMarkDeliveredRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
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
    if order.status == ORDER_STATUS_DELIVERED:
        return order
    if order.status != ORDER_STATUS_PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirme o pagamento antes de registrar a entrega",
        )

    order.status = ORDER_STATUS_DELIVERED
    order.delivered_at = datetime.utcnow()
    order.delivered_by_admin_id = current_admin.id
    order.delivery_note = (payload.delivery_note or "").strip() or None

    db.commit()
    db.refresh(order)
    return order
