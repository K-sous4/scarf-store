def test_health_does_not_expose_environment(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert "environment" not in body
    assert response.headers.get("x-content-type-options") == "nosniff"


def test_ping_does_not_expose_mode(client):
    response = client.get("/ping")
    assert response.status_code == 200
    body = response.json()
    assert body["msg"] == "pong"
    assert "mode" not in body
