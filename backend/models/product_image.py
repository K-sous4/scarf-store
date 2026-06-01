from sqlalchemy import Column, DateTime, ForeignKey, Integer, LargeBinary, String, func
from sqlalchemy.orm import relationship

from database.db import Base


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    filename = Column(String(255))
    content_type = Column(String(100))
    data = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    product = relationship("Product", back_populates="image_blobs")
