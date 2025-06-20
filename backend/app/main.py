import os
import json
import stripe
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from .database import engine, get_db
from .models import Product, Payment, ProductType, Base

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Payment API", version="1.0.0")

# Stripe конфигурация
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic модели
class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    type: ProductType


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    type: ProductType
    created_at: datetime

    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    product_id: int
    customer_email: str


class PaymentResponse(BaseModel):
    id: int
    product_id: int
    amount: float
    customer_email: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


@app.get("/")
def root():
    return {"message": "Payment API is running!"}


@app.get("/products/", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@app.post("/products/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # Создаем продукт в Stripe
    stripe_product = stripe.Product.create(name=product.name, description=product.description)
    stripe_price = stripe.Price.create(
        product=stripe_product.id,
        unit_amount=int(product.price * 100),  # цена в центах
        currency='usd',
    )

    # Сохраняем в БД
    db_product = Product(
        name=product.name,
        description=product.description,
        price=product.price,
        type=product.type,
        stripe_price_id=stripe_price.id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@app.post("/create-checkout-session/")
def create_checkout_session(request: CheckoutRequest, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == request.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': product.stripe_price_id,
                'quantity': 1,
            }],
            mode='payment',
            success_url='http://localhost:3000/success',
            cancel_url='http://localhost:3000/cancel',
            customer_email=request.customer_email,
        )

        # Сохраняем платеж в БД
        payment = Payment(
            product_id=product.id,
            stripe_session_id=checkout_session.id,
            amount=product.price,
            customer_email=request.customer_email,
            status="pending"
        )
        db.add(payment)
        db.commit()

        return {"checkout_url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Обрабатываем событие успешной оплаты
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        # Обновляем статус платежа в БД
        payment = db.query(Payment).filter(
            Payment.stripe_session_id == session['id']
        ).first()

        if payment:
            payment.status = "completed"
            db.commit()
            print(f"Payment {payment.id} marked as completed")

    return {"status": "success"}


@app.get("/payments/", response_model=List[PaymentResponse])
def get_payments(db: Session = Depends(get_db)):
    return db.query(Payment).order_by(Payment.created_at.desc()).all()


PORT = int(os.environ.get("PORT", 8000))