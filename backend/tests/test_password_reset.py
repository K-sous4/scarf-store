import uuid

from tests.conftest import login_user, register_user


def test_forgot_password_generic_response(client, unique_email):
    username = f"u_{uuid.uuid4().hex[:8]}"
    register_user(client, username, unique_email)
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": unique_email},
    )
    assert response.status_code == 200
    assert "e-mail" in response.json()["message"].lower()


def test_reset_password_flow(client, unique_email, fake_redis):
    username = f"u_{uuid.uuid4().hex[:8]}"
    password = "senha123"
    register_user(client, username, unique_email, password)

    client.post("/api/v1/auth/forgot-password", json={"email": unique_email})

    token = None
    for key in fake_redis._data:
        if key.startswith("password_reset:"):
            token = key.replace("password_reset:", "")
            break
    assert token

    validate = client.get(f"/api/v1/auth/reset-password/validate?token={token}")
    assert validate.status_code == 200

    reset = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "novaSenha1"},
    )
    assert reset.status_code == 200

    client.cookies.clear()
    old_login = login_user(client, username, password)
    assert old_login.status_code == 401

    new_login = login_user(client, username, "novaSenha1")
    assert new_login.status_code == 200
