from sqlalchemy import Column, Integer, String, DateTime, Float, Enum
from sqlalchemy.sql import func
from .database import Base
import enum


class ProductType(enum.Enum):
    LESSON = "lesson"
    COURSE = "course"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)  # в центах
    type = Column(Enum(ProductType))
    stripe_price_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer)
    stripe_session_id = Column(String)
    status = Column(String, default="pending")
    amount = Column(Float)
    customer_email = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())