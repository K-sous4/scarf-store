from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from database.db import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    buyer_username = Column(String(255), nullable=True, index=True)
    buyer_email = Column(String(255), nullable=True)

    shipping_recipient_name = Column(String(120), nullable=True)
    shipping_phone = Column(String(20), nullable=True)
    shipping_postal_code = Column(String(9), nullable=True)
    shipping_street = Column(String(200), nullable=True)
    shipping_number = Column(String(20), nullable=True)
    shipping_complement = Column(String(80), nullable=True)
    shipping_neighborhood = Column(String(100), nullable=True)
    shipping_city = Column(String(100), nullable=True)
    shipping_state = Column(String(2), nullable=True)
    shipping_address_formatted = Column(String(500), nullable=True)

    status = Column(String(30), nullable=False, default="pending_payment", index=True)
    payment_method = Column(String(30), nullable=False, default="pix")
    total_amount = Column(DECIMAL(10, 2), nullable=False)

    pix_key = Column(String(100), nullable=True)
    pix_txid = Column(String(30), nullable=True, index=True)
    payment_reference = Column(String(120), nullable=True)

    payment_reported_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    paid_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    terms_version = Column(String(20), nullable=True)
    terms_accepted_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    delivery_note = Column(String(255), nullable=True)
    delivered_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", foreign_keys=[user_id])
    paid_by_admin = relationship("User", foreign_keys=[paid_by_admin_id])
    delivered_by_admin = relationship("User", foreign_keys=[delivered_by_admin_id])
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
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)

    product_name = Column(String(255), nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(DECIMAL(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

    def __repr__(self):
        return f"<OrderItem(order_id={self.order_id}, product_id={self.product_id}, qty={self.quantity})>"
