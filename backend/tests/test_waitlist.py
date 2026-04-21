"""Backend tests for yayhop waitlist endpoints."""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load backend .env to get ADMIN_KEY
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None
if not BASE_URL:
    # Fallback: read frontend/.env
    fe_env = Path(__file__).resolve().parents[2] / "frontend" / ".env"
    for line in fe_env.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip('/')
            break

ADMIN_KEY = os.environ.get('ADMIN_KEY', '')


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
class TestHealth:
    def test_root(self, api):
        r = api.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------- Waitlist POST ----------
class TestWaitlistJoin:
    def test_happy_path(self, api):
        email = f"TEST_{uuid.uuid4().hex[:10]}@yayhop.test"
        r = api.post(f"{BASE_URL}/api/waitlist", json={"email": email, "name": "Tester"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert data["already_joined"] is False
        assert isinstance(data["position"], int)
        assert data["position"] >= 1

    def test_duplicate_email(self, api):
        email = f"TEST_dup_{uuid.uuid4().hex[:8]}@yayhop.test"
        r1 = api.post(f"{BASE_URL}/api/waitlist", json={"email": email})
        assert r1.status_code == 200
        assert r1.json()["already_joined"] is False

        r2 = api.post(f"{BASE_URL}/api/waitlist", json={"email": email})
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["already_joined"] is True
        assert d2["success"] is True

    def test_invalid_email_returns_422(self, api):
        r = api.post(f"{BASE_URL}/api/waitlist", json={"email": "not-an-email"})
        assert r.status_code == 422

    def test_missing_email_returns_422(self, api):
        r = api.post(f"{BASE_URL}/api/waitlist", json={})
        assert r.status_code == 422


# ---------- Waitlist count ----------
class TestWaitlistCount:
    def test_count_returns_int(self, api):
        r = api.get(f"{BASE_URL}/api/waitlist/count")
        assert r.status_code == 200
        data = r.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        assert data["count"] >= 0

    def test_count_increments_after_signup(self, api):
        before = api.get(f"{BASE_URL}/api/waitlist/count").json()["count"]
        email = f"TEST_inc_{uuid.uuid4().hex[:8]}@yayhop.test"
        r = api.post(f"{BASE_URL}/api/waitlist", json={"email": email})
        assert r.status_code == 200
        after = api.get(f"{BASE_URL}/api/waitlist/count").json()["count"]
        assert after == before + 1


# ---------- Admin endpoint ----------
class TestWaitlistAdmin:
    def test_admin_without_key_returns_422(self, api):
        r = api.get(f"{BASE_URL}/api/waitlist/admin")
        assert r.status_code == 422

    def test_admin_wrong_key_returns_403(self, api):
        r = api.get(f"{BASE_URL}/api/waitlist/admin", params={"key": "wrong-key"})
        assert r.status_code == 403

    def test_admin_correct_key_returns_array(self, api):
        assert ADMIN_KEY, "ADMIN_KEY must be set in backend/.env"
        r = api.get(f"{BASE_URL}/api/waitlist/admin", params={"key": ADMIN_KEY})
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        if data:
            entry = data[0]
            assert "email" in entry
            assert "id" in entry
            assert "_id" not in entry  # mongo _id must be excluded
