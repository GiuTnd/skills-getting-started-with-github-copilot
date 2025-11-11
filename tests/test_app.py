import sys
from pathlib import Path

# Ensure src/ is importable when running tests from the repository root
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from fastapi.testclient import TestClient
from app import app


client = TestClient(app)


def test_get_activities():
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    # basic sanity checks
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"].get("participants"), list)


def test_signup_and_unregister():
    activity = "Chess Club"
    email = "pytest.user@example.com"

    # Ensure clean state: remove if already present
    r = client.get("/activities")
    participants = r.json().get(activity, {}).get("participants", [])
    if email in participants:
        client.delete(f"/activities/{activity}/participants", params={"email": email})

    # Sign up
    r = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r.status_code == 200
    assert "Signed up" in r.json().get("message", "")

    # Verify presence
    r = client.get("/activities")
    assert email in r.json()[activity]["participants"]

    # Unregister
    r = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert r.status_code == 200
    assert "Unregistered" in r.json().get("message", "")

    # Verify removal
    r = client.get("/activities")
    assert email not in r.json()[activity]["participants"]
