def test_public_products_hide_internal_fields(client, sample_product):
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    products = response.json()["products"]
    product = next((item for item in products if item["id"] == sample_product.id), None)
    assert product is not None

    for hidden in (
        "cost",
        "sku",
        "stock",
        "reserved_stock",
        "low_stock_threshold",
        "description",
        "created_at",
        "updated_at",
    ):
        assert hidden not in product

    assert "available_stock" in product
    assert "is_low_stock" in product


def test_public_product_detail_hides_internal_fields(client, sample_product):
    response = client.get(f"/api/v1/products/{sample_product.id}")
    assert response.status_code == 200
    product = response.json()
    assert "cost" not in product
    assert "sku" not in product
    assert product["name"] == sample_product.name
