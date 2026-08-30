"""Scavvy backend API tests (pytest)."""
import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://scavvy-explore.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# --- Health -----------------------------------------------------------------
class TestHealth:
    def test_root_ok(self, s):
        r = s.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j.get("ok") is True
        assert "message" in j


# --- Adventure start (3 missions) -------------------------------------------
class TestAdventureStart:
    def test_start_returns_three_missions(self, s):
        r = s.post(f"{API}/adventure/start", json={
            "name": "TEST_Nishant", "personality": "explorer", "style": "RANDOM"
        }, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "id" in j and "missions" in j
        missions = j["missions"]
        assert isinstance(missions, list) and len(missions) == 3
        for i, m in enumerate(missions):
            assert m["index"] == i
            assert isinstance(m["title"], str) and len(m["title"]) > 0
            assert isinstance(m["hint"], str) and len(m["hint"]) > 0
            assert m["difficulty"] in ("Easy", "Medium", "Hard")

    def test_start_specific_style_uses_that_pool(self, s):
        r = s.post(f"{API}/adventure/start", json={
            "name": "TEST_A", "personality": "chaos", "style": "CHAOS"
        }, timeout=15)
        assert r.status_code == 200
        assert len(r.json()["missions"]) == 3


# --- Mission analyze --------------------------------------------------------
class TestAnalyze:
    def test_attempt_two_always_success(self, s):
        # Try several different titles to be safe; attempt>=2 must ALWAYS succeed
        titles = [
            "Find something blue that doesn't belong here.",
            "Find something older than it looks.",
            "Find the most ignored object around you.",
            "Find something that quietly does an important job.",
        ]
        for t in titles:
            r = s.post(f"{API}/mission/analyze", json={
                "mission_title": t, "mission_index": 0, "difficulty": "Easy",
                "personality": "explorer", "style": "RANDOM", "attempt": 2
            }, timeout=15)
            assert r.status_code == 200
            j = r.json()
            assert j["success"] is True, f"attempt 2 failed for: {t} -> {j}"
            assert isinstance(j.get("xp"), int) and j["xp"] > 0
            assert isinstance(j.get("scavvy_line"), str) and len(j["scavvy_line"]) > 0

    def test_attempt_one_returns_valid_shape(self, s):
        r = s.post(f"{API}/mission/analyze", json={
            "mission_title": "Find something blue that doesn't belong here.",
            "mission_index": 0, "difficulty": "Easy",
            "personality": "explorer", "style": "RANDOM", "attempt": 1
        }, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "success" in j and isinstance(j["success"], bool)
        assert "scavvy_line" in j and isinstance(j["scavvy_line"], str)
        assert "xp" in j

    def test_medium_difficulty_xp_higher(self, s):
        r = s.post(f"{API}/mission/analyze", json={
            "mission_title": "Find something older than it looks.",
            "mission_index": 2, "difficulty": "Medium",
            "personality": "explorer", "style": "RANDOM", "attempt": 2
        }, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j["success"] is True
        assert j["xp"] >= 100


# --- Easier mission ---------------------------------------------------------
class TestEasier:
    def test_easier_returns_mission(self, s):
        r = s.post(f"{API}/mission/easier", json={
            "mission_title": "Find something older than it looks.", "style": "RANDOM"
        }, timeout=15)
        assert r.status_code == 200
        j = r.json()
        for k in ("index", "title", "hint", "difficulty"):
            assert k in j
        assert j["difficulty"] == "Easy"
        assert isinstance(j["title"], str) and len(j["title"]) > 0


# --- Adventure summary ------------------------------------------------------
class TestSummary:
    def test_summary_shape(self, s):
        r = s.post(f"{API}/adventure/summary", json={
            "name": "TEST_Nishant", "personality": "explorer",
            "style": "RANDOM", "missions_completed": 3, "total_xp": 300
        }, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert isinstance(j.get("summary"), str) and len(j["summary"]) > 0
        traits = j.get("traits")
        assert isinstance(traits, dict)
        for k in ("explorer", "observation", "curiosity", "chaos"):
            assert k in traits
            assert isinstance(traits[k], int)
            assert 0 <= traits[k] <= 100

    def test_summary_all_personalities(self, s):
        for p in ("detective", "explorer", "creative", "chaos"):
            r = s.post(f"{API}/adventure/summary", json={
                "name": "TEST_A", "personality": p, "style": "RANDOM",
                "missions_completed": 3, "total_xp": 300
            }, timeout=15)
            assert r.status_code == 200
            j = r.json()
            assert set(j["traits"].keys()) == {"explorer", "observation", "curiosity", "chaos"}
