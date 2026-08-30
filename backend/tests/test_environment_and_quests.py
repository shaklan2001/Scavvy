"""Scavvy environment-scan / dynamic-quest / validate / hint endpoints."""
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


# --- Environment analyze ---------------------------------------------------
ENV_KEYS = {"environmentType", "visibleObjects", "colors", "landmarks",
            "possibleQuestTargets", "possibleHints"}


class TestEnvironmentAnalyze:
    @pytest.mark.parametrize("loc", ["Home", "Office", "Campus", "Outdoors", "Somewhere Else"])
    def test_analyze_no_images_returns_env(self, s, loc):
        r = s.post(f"{API}/environment/analyze", json={"location_type": loc}, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "environment" in j
        env = j["environment"]
        assert isinstance(env, dict)
        # Must have all six keys (mock guarantees them; llm output is normalised)
        missing = ENV_KEYS - set(env.keys())
        assert not missing, f"missing keys {missing} for {loc}: {env}"
        for k in ("visibleObjects", "colors", "landmarks",
                  "possibleQuestTargets", "possibleHints"):
            assert isinstance(env[k], list) and len(env[k]) > 0, f"{k} empty for {loc}"
        assert isinstance(env["environmentType"], str) and env["environmentType"]

    def test_analyze_with_dummy_images_still_returns_env(self, s):
        # 1x1 png base64
        tiny_png = ("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk"
                    "+A8AAQUBAScY42YAAAAASUVORK5CYII=")
        r = s.post(f"{API}/environment/analyze",
                   json={"location_type": "Office", "images": [tiny_png]}, timeout=45)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "environment" in j
        env = j["environment"]
        assert ENV_KEYS.issubset(set(env.keys()))


# --- Environment quests ----------------------------------------------------
QUEST_KEYS = {"type", "title", "hint", "difficulty", "xp"}


class TestEnvironmentQuests:
    def test_quests_from_location_only(self, s):
        r = s.post(f"{API}/environment/quests", json={"location_type": "Office"}, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "quests" in j
        quests = j["quests"]
        assert isinstance(quests, list) and len(quests) == 3
        for q in quests:
            missing = QUEST_KEYS - set(q.keys())
            assert not missing, f"quest missing {missing}: {q}"
            assert isinstance(q["title"], str) and q["title"]
            assert isinstance(q["hint"], str) and q["hint"]
            assert isinstance(q["xp"], int) and q["xp"] > 0
            assert q["difficulty"] in ("Easy", "Medium", "Hard")

    def test_quests_with_environment(self, s):
        env = {
            "environmentType": "a busy office",
            "visibleObjects": ["laptop", "whiteboard"],
            "colors": ["blue"], "landmarks": ["desk"],
            "possibleQuestTargets": ["whiteboard"], "possibleHints": ["a hint"],
        }
        r = s.post(f"{API}/environment/quests",
                   json={"location_type": "Office", "environment": env}, timeout=30)
        assert r.status_code == 200, r.text
        assert len(r.json()["quests"]) == 3


# --- Quest validate --------------------------------------------------------
class TestQuestValidate:
    def test_attempt_2_always_success(self, s):
        for title in ["Find something blue.", "Find the whiteboard.", "Find a lamp."]:
            r = s.post(f"{API}/quest/validate",
                       json={"mission_title": title, "attempt": 2}, timeout=15)
            assert r.status_code == 200, r.text
            j = r.json()
            assert j["success"] is True, f"attempt 2 not success for {title}: {j}"
            assert isinstance(j.get("xp"), int) and j["xp"] > 0
            assert isinstance(j.get("scavvy_line"), str) and j["scavvy_line"]

    def test_attempt_1_valid_shape(self, s):
        r = s.post(f"{API}/quest/validate",
                   json={"mission_title": "Find something blue.", "attempt": 1}, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert isinstance(j.get("success"), bool)
        assert isinstance(j.get("scavvy_line"), str) and j["scavvy_line"]
        assert "xp" in j


# --- Quest hint ------------------------------------------------------------
class TestQuestHint:
    @pytest.mark.parametrize("lvl", [1, 2, 3])
    def test_hint_returns_string(self, s, lvl):
        r = s.post(f"{API}/quest/hint",
                   json={"mission_title": "Find something blue.", "hint_level": lvl}, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert isinstance(j.get("hint"), str) and len(j["hint"]) > 0

    def test_hint_with_environment(self, s):
        env = {"possibleHints": ["near the door", "close to the desk", "on the shelf"]}
        r = s.post(f"{API}/quest/hint",
                   json={"mission_title": "Find something blue.", "environment": env, "hint_level": 2},
                   timeout=30)
        assert r.status_code == 200
        assert r.json().get("hint")
