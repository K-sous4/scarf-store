from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from database.db import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    status = Column(String(30), nullable=False, default="pending_payment", index=True)
    payment_method = Column(String(30), nullable=False, default="pix")
    total_amount = Column(DECIMAL(10, 2), nullable=False)

    pix_key = Column(String(100), nullable=True)
    pix_txid = Column(String(30), nullable=True, index=True)
    payment_reference = Column(String(120), nullable=True)

    payment_reported_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User")
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id}, status='{self.status}')>"


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)

    product_name = Column(String(255), nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(DECIMAL(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

    def __repr__(self):
        return f"<OrderItem(order_id={self.order_id}, product_id={self.product_id}, qty={self.quantity})>"
