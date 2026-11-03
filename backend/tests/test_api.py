def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("healthy", "degraded")
    assert data["database_connected"] is True

def test_extraction_methods_endpoint(client):
    res = client.get("/api/extraction/methods")
    assert res.status_code == 200
    data = res.json()
    assert "methods" in data
    assert len(data["methods"]) >= 4

def test_security_audit_api(client):
    res = client.post("/api/security/run-audit")
    assert res.status_code == 200
    data = res.json()
    assert data["all_passed"] is True
    assert len(data["tests"]) == 5

def test_synthetic_dataset_generation_api(client):
    res = client.post("/api/datasets/generate-synthetic", json={"dataset_name": "API Test Dataset", "count": 3})
    assert res.status_code == 200
    data = res.json()
    assert "dataset_id" in data
    assert len(data["documents"]) == 3

