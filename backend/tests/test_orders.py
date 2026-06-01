import uuid
from datetime import datetime, timedelta

from models.order import Order
from services.order_expiry import ORDER_STATUS_CANCELLED, ORDER_STATUS_PENDING, expire_stale_pending_orders

from tests.conftest import (
    current_terms_version,
    fill_shipping_profile,
    login_user,
    register_user,
)


def _register_and_login(client, email: str):
    username = f"buyer_{uuid.uuid4().hex[:8]}"
    register_user(client, username, email)
    client.cookies.clear()
    login_user(client, username)
    return username


def test_create_order_without_address_fails(client, payment_settings, sample_product, unique_email):
    _register_and_login(client, unique_email)
    version = current_terms_version(client)
    response = client.post(
        "/api/v1/orders/",
        json={
            "items": [{"product_id": sample_product.id, "quantity": 1}],
            "accept_terms": True,
            "terms_version": version,
        },
    )
    assert response.status_code == 400
    assert "perfil" in response.json()["detail"].lower()


def test_create_order_with_profile_address(client, payment_settings, sample_product, unique_email, db_session):
    _register_and_login(client, unique_email)
    fill_shipping_profile(client)
    version = current_terms_version(client)
    response = client.post(
        "/api/v1/orders/",
        json={
            "items": [{"product_id": sample_product.id, "quantity": 1}],
            "accept_terms": True,
            "terms_version": version,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending_payment"
    assert data["shipping_street"] == "Av Paulista"

    db_session.refresh(sample_product)
    assert sample_product.reserved_stock == 1


def test_cancel_order_releases_stock(client, payment_settings, sample_product, unique_email, db_session):
    _register_and_login(client, unique_email)
    fill_shipping_profile(client)
    version = current_terms_version(client)
    created = client.post(
        "/api/v1/orders/",
        json={
            "items": [{"product_id": sample_product.id, "quantity": 2}],
            "accept_terms": True,
            "terms_version": version,
        },
    )
    order_id = created.json()["id"]
    cancelled = client.post(f"/api/v1/orders/{order_id}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    db_session.refresh(sample_product)
    assert sample_product.reserved_stock == 0


def test_expire_stale_pending_orders(client, payment_settings, sample_product, unique_email, db_session):
    _register_and_login(client, unique_email)
    fill_shipping_profile(client)
    version = current_terms_version(client)
    created = client.post(
        "/api/v1/orders/",
        json={
            "items": [{"product_id": sample_product.id, "quantity": 1}],
            "accept_terms": True,
            "terms_version": version,
        },
    )
    order_id = created.json()["id"]
    order = db_session.query(Order).filter(Order.id == order_id).first()
    order.created_at = datetime.utcnow() - timedelta(hours=72)
    db_session.commit()

    expired_count = expire_stale_pending_orders(db_session, max_age_hours=48)
    assert expired_count == 1

    db_session.refresh(order)
    db_session.refresh(sample_product)
    assert order.status == ORDER_STATUS_CANCELLED
    assert sample_product.reserved_stock == 0
