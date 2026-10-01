import pytest
from fastapi.testclient import TestClient

from app.main import app, reset_db


@pytest.fixture(autouse=True)
def clean_db():
    reset_db()
    yield


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_get_items_returns_list(client):
    response = client.get("/items")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_create_item(client):
    response = client.post("/items", json={"name": "Lint", "description": "Ruff check"})
    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 3
    assert body["name"] == "Lint"
    assert len(client.get("/items").json()) == 3


def test_create_item_rejects_empty_name(client):
    response = client.post("/items", json={"name": ""})
    assert response.status_code == 422


def test_get_item_by_id(client):
    response = client.get("/items/1")
    assert response.status_code == 200
    assert response.json()["name"] == "Unit tests"


def test_get_item_invalid_id_returns_404(client):
    response = client.get("/items/9999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Item not found"}


def test_pipeline_status(client):
    response = client.get("/pipeline/status")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "passing"
    assert body["last_build"] == "success"
    assert "environment" in body
