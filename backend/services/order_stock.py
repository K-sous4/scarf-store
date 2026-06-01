"""Operações de estoque ligadas a pedidos."""

from models.order import Order
from models.product import Product
from sqlalchemy.orm import Session


def recalculate_available(product: Product) -> None:
    product.available_stock = max(0, product.stock - product.reserved_stock)


def release_order_reservations(order: Order, db: Session) -> None:
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue
        product.reserved_stock = max(0, product.reserved_stock - item.quantity)
        recalculate_available(product)
