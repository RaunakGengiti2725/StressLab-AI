from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "stresslab-api"


def test_list_materials():
    response = client.get("/api/agents/materials")
    assert response.status_code == 200
    data = response.json()
    assert len(data["materials"]) == 6
    assert data["materials"][0]["id"] == "pla"


def test_simulation_state_stub():
    response = client.get("/api/simulation/state")
    assert response.status_code == 200
    data = response.json()
    assert data["material_id"] == "pla"
    assert data["stress"]["max_stress_mpa"] > 0


def test_agent_evaluate_stub():
    response = client.get("/api/agents/evaluate")
    assert response.status_code == 200
    data = response.json()
    assert len(data["agents"]) == 6
    for agent in data["agents"]:
        assert "risk_score" in agent
        assert "agent_name" in agent
