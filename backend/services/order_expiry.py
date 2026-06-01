"""Cancela pedidos pendentes expirados e libera estoque reservado."""

import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy.orm import Session, selectinload

from config.settings import ORDER_EXPIRY_CHECK_MINUTES, PENDING_ORDER_EXPIRE_HOURS
from database.db import SessionLocal
from models.order import Order
from services.order_stock import release_order_reservations

logger = logging.getLogger(__name__)

ORDER_STATUS_PENDING = "pending_payment"
ORDER_STATUS_CANCELLED = "cancelled"


def expire_stale_pending_orders(
    db: Session,
    max_age_hours: int | None = None,
) -> int:
    hours = max_age_hours if max_age_hours is not None else PENDING_ORDER_EXPIRE_HOURS
    cutoff = datetime.utcnow() - timedelta(hours=hours)

    orders = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(
            Order.status == ORDER_STATUS_PENDING,
            Order.created_at < cutoff,
        )
        .all()
    )

    if not orders:
        return 0

    for order in orders:
        release_order_reservations(order, db)
        order.status = ORDER_STATUS_CANCELLED

    db.commit()
    logger.info("Cancelados %d pedido(s) pendente(s) expirado(s) (>%sh)", len(orders), hours)
    return len(orders)


async def order_expiry_loop(stop_event: asyncio.Event) -> None:
    interval_seconds = max(60, ORDER_EXPIRY_CHECK_MINUTES * 60)

    while not stop_event.is_set():
        db = SessionLocal()
        try:
            expire_stale_pending_orders(db)
        except Exception as exc:
            logger.error("Erro ao expirar pedidos pendentes: %s", exc)
            db.rollback()
        finally:
            db.close()

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval_seconds)
        except asyncio.TimeoutError:
            continue
