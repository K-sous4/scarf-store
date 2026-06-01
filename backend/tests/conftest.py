import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("ENVIRONMENT", "test")

from database.db import get_db  # noqa: E402
from main import app  # noqa: E402


class FakeRedis:
    def __init__(self):
        self._data: dict[str, str] = {}
        self._expiry: dict[str, int] = {}

    def setex(self, key: str, ttl: int, value: str) -> None:
        self._data[key] = value
        self._expiry[key] = ttl

    def get(self, key: str):
        return self._data.get(key)

    def delete(self, key: str) -> int:
        return 1 if self._data.pop(key, None) is not None else 0

    def expire(self, key: str, ttl: int) -> bool:
        if key in self._data:
            self._expiry[key] = ttl
            return True
        return False

    def incr(self, key: str) -> int:
        current = int(self._data.get(key, 0))
        current += 1
        self._data[key] = str(current)
        return current

    def scan_iter(self, match: str | None = None):
        prefix = (match or "").replace("*", "")
        for key in list(self._data.keys()):
            if not prefix or key.startswith(prefix):
                yield key


@pytest.fixture(autouse=True)
def fake_redis(monkeypatch):
    client = FakeRedis()
    monkeypatch.setattr("services.session.session_manager.redis_client", client)
    monkeypatch.setattr("services.password_reset.password_reset_service.redis", client)
    return client


@pytest.fixture
def db_session():
    from database.db import SessionLocal

    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def unique_email():
    return f"user_{uuid.uuid4().hex[:10]}@example.com"


@pytest.fixture
def payment_settings(db_session):
    from models.payment_settings import PaymentSettings

    settings = db_session.query(PaymentSettings).first()
    if not settings:
        settings = PaymentSettings(phone_number="11999990000", delivery_commitment_days=7)
        db_session.add(settings)
        db_session.commit()
    elif not settings.phone_number:
        settings.phone_number = "11999990000"
        db_session.commit()
    return settings


@pytest.fixture
def sample_product(db_session):
    from models.product import Product

    product = Product(
        sku=f"TEST-{uuid.uuid4().hex[:6]}",
        name="Lenço Teste",
        short_description="Produto para testes",
        description="Descricao teste",
        category="Lenços de Seda",
        price=50.00,
        cost=20.00,
        discount_percentage=0,
        stock=20,
        low_stock_threshold=2,
        reserved_stock=0,
        available_stock=20,
        material="Seda",
        color="Marfim",
        is_active=True,
        is_featured=False,
        is_new=False,
        images=[],
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product


def register_user(client: TestClient, username: str, email: str, password: str = "senha123"):
    return client.post(
        "/api/v1/auth/sign-in",
        json={"username": username, "password": password, "email": email},
    )


def login_user(client: TestClient, username: str, password: str = "senha123"):
    return client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )


def fill_shipping_profile(client: TestClient, recipient: str = "Cliente Teste"):
    return client.put(
        "/api/v1/users/me",
        json={
            "full_name": recipient,
            "phone": "11988887777",
            "postal_code": "01310-100",
            "street": "Av Paulista",
            "number": "1000",
            "neighborhood": "Bela Vista",
            "city": "Sao Paulo",
            "state": "SP",
        },
    )


def current_terms_version(client: TestClient) -> str:
    response = client.get("/api/v1/orders/purchase-terms")
    assert response.status_code == 200
    return response.json()["version"]
