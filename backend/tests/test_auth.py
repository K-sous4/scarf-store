import uuid

from tests.conftest import login_user, register_user


def test_signup_requires_email(client):
    username = f"u_{uuid.uuid4().hex[:8]}"
    response = client.post(
        "/api/v1/auth/sign-in",
        json={"username": username, "password": "senha123"},
    )
    assert response.status_code == 422


def test_signup_with_email_creates_session(client, unique_email):
    username = f"u_{uuid.uuid4().hex[:8]}"
    response = register_user(client, username, unique_email)
    assert response.status_code == 201
    assert response.json()["user"]["username"] == username


def test_login_success(client, unique_email):
    username = f"u_{uuid.uuid4().hex[:8]}"
    password = "senha123"
    register_user(client, username, unique_email, password)
    client.cookies.clear()
    response = login_user(client, username, password)
    assert response.status_code == 200
    assert response.json()["user"]["username"] == username


def test_login_invalid_password(client, unique_email):
    username = f"u_{uuid.uuid4().hex[:8]}"
    register_user(client, username, unique_email)
    client.cookies.clear()
    response = login_user(client, username, "senhaerrada")
    assert response.status_code == 401
