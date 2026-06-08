import uuid

from models.order import Order, OrderItem
from models.user import User
from tests.conftest import (
    current_terms_version,
    fill_shipping_profile,
    login_user,
    register_user,
)


def _admin_client(client, db_session):
    username = f"admin_{uuid.uuid4().hex[:8]}"
    register_user(client, username, f"{username}@example.com")
    user = db_session.query(User).filter(User.username == username).first()
    user.role = "admin"
    db_session.commit()
    client.cookies.clear()
    login_user(client, username)
    return user


def test_delete_product_with_delivered_order(client, payment_settings, sample_product, unique_email, db_session):
    buyer = f"buyer_{uuid.uuid4().hex[:8]}"
    register_user(client, buyer, unique_email)
    client.cookies.clear()
    login_user(client, buyer)
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
    client.post(f"/api/v1/orders/{order_id}/confirm-payment", json={"reference": "PIX-TEST-001"})

    _admin_client(client, db_session)
    paid = client.post(f"/api/v1/orders/{order_id}/mark-paid")
    assert paid.status_code == 200
    client.post(f"/api/v1/orders/{order_id}/mark-delivered", json={"delivery_note": "AA123BR"})

    deleted = client.delete(f"/api/v1/products/{sample_product.id}")
    assert deleted.status_code == 204

    item = db_session.query(OrderItem).filter(OrderItem.order_id == order_id).first()
    assert item is not None
    assert item.product_id is None
    assert item.product_name == sample_product.name

    order = db_session.query(Order).filter(Order.id == order_id).first()
    assert order.status == "delivered"
