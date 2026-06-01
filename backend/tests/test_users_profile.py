import uuid

from tests.conftest import login_user, register_user


def test_profile_has_shipping_flag(client, unique_email):
    username = f"u_{uuid.uuid4().hex[:8]}"
    register_user(client, username, unique_email)
    client.cookies.clear()
    login_user(client, username)

    profile = client.get("/api/v1/users/me")
    assert profile.status_code == 200
    assert profile.json()["has_shipping_address"] is False

    updated = client.put(
        "/api/v1/users/me",
        json={
            "full_name": "Maria Teste",
            "phone": "11977776666",
            "postal_code": "01310100",
            "street": "Rua Teste",
            "number": "10",
            "neighborhood": "Centro",
            "city": "Sao Paulo",
            "state": "SP",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["has_shipping_address"] is True
