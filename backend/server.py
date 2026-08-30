from fastapi import FastAPI, APIRouter
from fastapi import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import hashlib
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Scavvy API")
api_router = APIRouter(prefix="/api")

# ---------------------------------------------------------------------------
# Scavvy mock AI service.
# Clean service interfaces so real OpenAI / ElevenLabs keys can be wired in
# server-side later. For now everything returns realistic playful mock data.
# ---------------------------------------------------------------------------

MISSION_POOLS = {
    "MYSTERY": [
        "Find something that looks completely ordinary but has a secret purpose.",
        "Find something that's hiding in plain sight.",
        "Find something older than it looks.",
        "Find a clue that something happened here before you arrived.",
        "Find something that keeps a secret.",
        "Find something that has clearly been somewhere it shouldn't.",
    ],
    "DISCOVERY": [
        "Find something nearby that makes someone's life easier.",
        "Find something you walk past every day but never really see.",
        "Find something that has been waiting longer than you have.",
        "Find something designed by a person who really cared.",
        "Find the most ignored object around you.",
        "Find something that quietly does an important job.",
    ],
    "CHAOS": [
        "Find something blue that doesn't belong here.",
        "Find the most dramatic object within reach.",
        "Find something that would make a terrible gift.",
        "Find something pretending to be something else.",
        "Find the strangest texture near you.",
        "Find something that looks way too proud of itself.",
    ],
}

HINTS = [
    "Don't overthink it.",
    "Trust your gut.",
    "First thing you see counts.",
    "Scavvy trusts you.",
    "The obvious answer is usually the fun one.",
]

SUCCESS_LINES = [
    "Yep. That absolutely counts. Suspiciously good taste.",
    "A fine specimen. Scavvy approves.",
    "Ooh, sneaky choice. I like how your brain works.",
    "That? That's exactly the kind of thing I meant.",
    "Case closed. You noticed what most people miss.",
    "Textbook find. You've clearly done this before.",
]

FAIL_LINES = [
    "Technically... everything makes you wait if you're patient enough.",
    "Bold interpretation. I respect it, but no.",
    "I see what you did there. I just don't agree with it.",
    "Close! In a parallel universe, that totally works.",
    "Interesting evidence, detective. Not quite the case though.",
]

DETECTED = [
    "One suspicious object detected",
    "Something interesting spotted",
    "A curious little discovery",
    "One very photogenic subject",
]

PERSONA_TRAITS = {
    "detective": {"explorer": 78, "observation": 95, "curiosity": 90, "chaos": 45},
    "explorer": {"explorer": 96, "observation": 80, "curiosity": 88, "chaos": 55},
    "creative": {"explorer": 82, "observation": 84, "curiosity": 93, "chaos": 70},
    "chaos": {"explorer": 80, "observation": 72, "curiosity": 86, "chaos": 95},
}

SUMMARY_LINES = {
    "detective": "You're surprisingly good at noticing ordinary things.",
    "explorer": "You treat every corner like it owes you a discovery.",
    "creative": "You find stories in objects most people ignore.",
    "chaos": "You picked the weirdest possible answers. I'm impressed and concerned.",
}


def _seed(*parts) -> random.Random:
    h = hashlib.md5("::".join(str(p) for p in parts).encode()).hexdigest()
    return random.Random(int(h[:8], 16))


def build_missions(style: str, personality: str, count: int = 3) -> List[dict]:
    style = (style or "RANDOM").upper()
    if style == "RANDOM" or style not in MISSION_POOLS:
        pool = [m for arr in MISSION_POOLS.values() for m in arr]
    else:
        pool = list(MISSION_POOLS[style])
    rng = _seed(style, personality, datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f"))
    rng.shuffle(pool)
    chosen = pool[:count]
    diffs = ["Easy", "Easy", "Medium"]
    missions = []
    for i, title in enumerate(chosen):
        missions.append({
            "index": i,
            "title": title,
            "hint": rng.choice(HINTS),
            "difficulty": diffs[i] if i < len(diffs) else "Medium",
        })
    return missions


# -------------------------- models --------------------------
class StartAdventureReq(BaseModel):
    name: Optional[str] = "Explorer"
    personality: Optional[str] = "explorer"
    style: Optional[str] = "RANDOM"


class AnalyzeReq(BaseModel):
    mission_title: str
    mission_index: int = 0
    difficulty: Optional[str] = "Easy"
    personality: Optional[str] = "explorer"
    style: Optional[str] = "RANDOM"
    attempt: int = 1


class EasierReq(BaseModel):
    mission_title: str
    style: Optional[str] = "RANDOM"


class SummaryReq(BaseModel):
    name: Optional[str] = "Explorer"
    personality: Optional[str] = "explorer"
    style: Optional[str] = "RANDOM"
    missions_completed: int = 3
    total_xp: int = 300


# -------------------------- routes --------------------------
@api_router.get("/")
async def root():
    return {"message": "Scavvy is awake and sniffing around.", "ok": True}


@api_router.post("/adventure/start")
async def start_adventure(req: StartAdventureReq):
    missions = build_missions(req.style, req.personality)
    adventure = {
        "id": str(uuid.uuid4()),
        "name": req.name,
        "personality": req.personality,
        "style": req.style,
        "missions": missions,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await db.adventures.insert_one({**adventure})
    except Exception as e:
        logger.warning(f"persist adventure failed: {e}")
    return adventure


@api_router.post("/mission/analyze")
async def analyze_mission(req: AnalyzeReq):
    # First attempt has a small playful chance of a "miss"; retries always land.
    rng = _seed(req.mission_title, req.mission_index, req.attempt)
    success = True
    if req.attempt <= 1:
        success = rng.random() > 0.25
    title = req.mission_title.lower()
    if success:
        if "easier" in title or "life easier" in title:
            line = "Yep — that definitely makes someone's life easier."
        elif "blue" in title:
            line = "That's about as blue as it gets. Sneaky. I like it."
        elif "waiting" in title:
            line = "Oh, that has absolutely been waiting. Patient little thing."
        else:
            line = rng.choice(SUCCESS_LINES)
        xp = 100 if (req.difficulty or "Easy").lower() != "medium" else 120
        return {
            "success": True,
            "xp": xp,
            "detected": rng.choice(DETECTED),
            "reasoning": line,
            "scavvy_line": line,
        }
    return {
        "success": False,
        "xp": 0,
        "detected": rng.choice(DETECTED),
        "reasoning": rng.choice(FAIL_LINES),
        "scavvy_line": "I don't think that's quite what I was looking for.",
    }


@api_router.post("/mission/easier")
async def easier_mission(req: EasierReq):
    easy_pool = [
        "Find literally anything orange. That's it. That's the mission.",
        "Find something round. Scavvy loves round things.",
        "Find something soft you could nap on.",
        "Find something with a face (real or imaginary).",
        "Find something that makes a sound.",
    ]
    rng = _seed(req.mission_title, "easier")
    return {
        "index": 0,
        "title": rng.choice(easy_pool),
        "hint": "Okay okay, I made it easy. Go.",
        "difficulty": "Easy",
    }


@api_router.post("/adventure/summary")
async def adventure_summary(req: SummaryReq):
    p = (req.personality or "explorer").lower()
    base = PERSONA_TRAITS.get(p, PERSONA_TRAITS["explorer"])
    rng = _seed(p, req.total_xp, req.missions_completed)
    traits = {k: max(45, min(99, v + rng.randint(-6, 6))) for k, v in base.items()}
    return {
        "headline": "ADVENTURE COMPLETE",
        "summary": SUMMARY_LINES.get(p, SUMMARY_LINES["explorer"]),
        "traits": traits,
        "total_xp": req.total_xp,
        "streak_delta": 1,
    }


ELEVEN_KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()
ELEVEN_VOICE = os.environ.get("ELEVENLABS_VOICE_ID", "").strip() or "21m00Tcm4Tlm"

VOICE_TEXT = {
    "mission_intro": "Alright explorer. Your next mission starts now. Eyes open.",
    "success": "That counts! Nice work. Let's make the next one harder.",
    "failure": "Hmm, nice try. I don't think that's quite what I was looking for.",
    "adventure_complete": "You did it! Three missions complete. Not bad, detective.",
}


@api_router.get("/voice")
async def voice(line: str):
    """Returns ElevenLabs-generated audio when a key is configured, otherwise
    204 so the app falls back to its bundled Scavvy voice clips."""
    text = VOICE_TEXT.get(line)
    if not text:
        return Response(status_code=204)
    if not ELEVEN_KEY:
        return Response(status_code=204)
    try:
        import base64
        from elevenlabs.client import ElevenLabs
        client = ElevenLabs(api_key=ELEVEN_KEY)
        audio_iter = client.text_to_speech.convert(
            text=text,
            voice_id=ELEVEN_VOICE,
            model_id="eleven_multilingual_v2",
        )
        data = b"".join(audio_iter)
        b64 = base64.b64encode(data).decode()
        return {"audio": f"data:audio/mpeg;base64,{b64}", "caption": text}
    except Exception as e:
        logger.warning(f"ElevenLabs TTS unavailable, using fallback: {e}")
        return Response(status_code=204)


EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "").strip()


def _parse_json(text: str):
    import json, re
    if not text:
        return None
    t = text.strip()
    t = re.sub(r"^```(json)?", "", t).strip()
    t = re.sub(r"```$", "", t).strip()
    m = re.search(r"\{.*\}", t, re.DOTALL)
    if m:
        t = m.group(0)
    try:
        return json.loads(t)
    except Exception:
        return None


async def _llm(system: str, text: str, images=None, model: str = "gpt-4o"):
    if not EMERGENT_LLM_KEY:
        raise RuntimeError("no key")
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=str(uuid.uuid4()), system_message=system).with_model("openai", model)
    files = [ImageContent(image_base64=b) for b in (images or []) if b]
    msg = UserMessage(text=text, file_contents=files or None)
    return await chat.send_message(msg)


# --------- environment mocks (feel room-specific per location) ----------
ENV_MOCK = {
    "Home": {"environmentType": "a cosy home", "visibleObjects": ["mug", "lamp", "remote control", "houseplant", "book", "charger"], "colors": ["warm brown", "cream", "green"], "landmarks": ["sofa", "window"], "possibleQuestTargets": ["remote control", "houseplant", "mug"], "possibleHints": ["near where people relax", "something that needs water"]},
    "Office": {"environmentType": "a busy office", "visibleObjects": ["laptop", "whiteboard", "coffee cup", "monitor", "sticky notes", "backpack"], "colors": ["grey", "blue", "white"], "landmarks": ["desk", "meeting board"], "possibleQuestTargets": ["whiteboard", "laptop", "coffee cup"], "possibleHints": ["people look at it in meetings", "useless without electricity"]},
    "Campus": {"environmentType": "a university campus", "visibleObjects": ["backpack", "notebook", "water bottle", "projector", "bench", "poster"], "colors": ["blue", "green", "white"], "landmarks": ["lecture board", "noticeboard"], "possibleQuestTargets": ["projector", "water bottle", "poster"], "possibleHints": ["helps a big group see", "keeps you hydrated"]},
    "Outdoors": {"environmentType": "an outdoor space", "visibleObjects": ["tree", "bench", "sign", "bicycle", "trash bin", "streetlight"], "colors": ["green", "grey", "brown"], "landmarks": ["path", "signpost"], "possibleQuestTargets": ["sign", "bench", "streetlight"], "possibleHints": ["tells you where to go", "lights up at night"]},
    "Somewhere Else": {"environmentType": "an interesting space", "visibleObjects": ["chair", "bottle", "bag", "phone", "clock", "cup"], "colors": ["mixed"], "landmarks": ["corner", "table"], "possibleQuestTargets": ["clock", "bottle", "bag"], "possibleHints": ["it keeps track of time", "you carry things in it"]},
}


class EnvAnalyzeReq(BaseModel):
    location_type: Optional[str] = "Home"
    images: Optional[List[str]] = None


class EnvQuestsReq(BaseModel):
    location_type: Optional[str] = "Home"
    environment: Optional[dict] = None


class ValidateReq(BaseModel):
    mission_title: str
    environment: Optional[dict] = None
    image: Optional[str] = None
    attempt: int = 1


class HintReq(BaseModel):
    mission_title: str
    environment: Optional[dict] = None
    hint_level: int = 1


@api_router.post("/environment/analyze")
async def environment_analyze(req: EnvAnalyzeReq):
    system = ("You are Scavvy, a playful scavenger-hunt raccoon. Look at these photos of a "
              "real space and identify ONLY safe, non-sensitive, generic OBJECTS and features "
              "useful for a scavenger hunt. Never identify people, faces, text with personal "
              "info, or anything unsafe. Respond ONLY with compact JSON with keys: "
              "environmentType, visibleObjects (array), colors (array), landmarks (array), "
              "possibleQuestTargets (array), possibleHints (array).")
    try:
        out = await _llm(system, f"Location type: {req.location_type}. Describe this space for a scavenger hunt.", images=(req.images or [])[:3])
        data = _parse_json(out)
        if data and data.get("visibleObjects"):
            data["environmentType"] = data.get("environmentType") or f"a {req.location_type} space"
            return {"environment": data, "source": "vision"}
    except Exception as e:
        logger.warning(f"env analyze fallback: {e}")
    return {"environment": ENV_MOCK.get(req.location_type or "Home", ENV_MOCK["Home"]), "source": "mock"}


def _mock_quests(env: dict):
    objs = (env or {}).get("visibleObjects", ["object"])
    targets = (env or {}).get("possibleQuestTargets", objs)[:3] or objs[:3]
    while len(targets) < 3:
        targets.append(objs[len(targets) % len(objs)] if objs else "something")
    return [
        {"id": "q1", "type": "observation", "title": f"Find something that helps people communicate without speaking.", "hint": "You'll know it when you see it.", "difficulty": "Easy", "xp": 100},
        {"id": "q2", "type": "reasoning", "title": f"I remember seeing something {(env.get('colors') or ['colourful'])[0]}. Find it.", "hint": "Trust your memory of the room.", "difficulty": "Medium", "xp": 150},
        {"id": "q3", "type": "visual", "title": f"Find something that becomes much less useful without electricity.", "hint": "It probably has a plug or a battery.", "difficulty": "Easy", "xp": 75},
    ]


@api_router.post("/environment/quests")
async def environment_quests(req: EnvQuestsReq):
    env = req.environment or ENV_MOCK.get(req.location_type or "Home", ENV_MOCK["Home"])
    system = ("You are Scavvy. Using the detected environment, invent 3 playful scavenger-hunt "
              "quests that require light REASONING (never name the object directly). Types: "
              "observation, reasoning, visual. Keep them safe and doable indoors/outdoors. "
              "Respond ONLY as JSON: {\"quests\":[{\"type\",\"title\",\"hint\",\"difficulty\",\"xp\"}]}. "
              "Use xp 75/100/150 and difficulty Easy/Medium.")
    try:
        import json as _json
        out = await _llm(system, f"Environment JSON: {_json.dumps(env)[:1500]}")
        data = _parse_json(out)
        quests = (data or {}).get("quests")
        if quests and len(quests) >= 3:
            for i, q in enumerate(quests[:3]):
                q["id"] = f"q{i+1}"
                q.setdefault("type", "observation")
                q.setdefault("hint", "Trust your gut.")
                q.setdefault("difficulty", "Easy")
                q.setdefault("xp", 100)
            return {"quests": quests[:3], "source": "llm"}
    except Exception as e:
        logger.warning(f"env quests fallback: {e}")
    return {"quests": _mock_quests(env), "source": "mock"}


@api_router.post("/quest/validate")
async def quest_validate(req: ValidateReq):
    if EMERGENT_LLM_KEY and req.image and req.attempt <= 1:
        system = ("You are Scavvy validating a scavenger-hunt photo. Decide if the photo "
                  "plausibly satisfies the mission (be generous & playful). Respond ONLY JSON: "
                  "{\"success\":bool,\"confidence\":0-1,\"explanation\":str,\"scavvyReaction\":str}.")
        try:
            out = await _llm(system, f"Mission: {req.mission_title}", images=[req.image])
            data = _parse_json(out)
            if data is not None and "success" in data:
                return {
                    "success": bool(data.get("success")),
                    "xp": 120 if str(req.mission_title).lower().find("medium") >= 0 else 100,
                    "reasoning": data.get("explanation") or data.get("scavvyReaction") or "Nice find.",
                    "scavvy_line": data.get("scavvyReaction") or data.get("explanation") or "That counts!",
                }
        except Exception as e:
            logger.warning(f"validate fallback: {e}")
    # deterministic fallback (attempt>=2 always success)
    rng = _seed(req.mission_title, req.attempt)
    success = True if req.attempt > 1 else (rng.random() > 0.2)
    if success:
        return {"success": True, "xp": 100, "reasoning": rng.choice(SUCCESS_LINES), "scavvy_line": rng.choice(SUCCESS_LINES)}
    return {"success": False, "xp": 0, "reasoning": rng.choice(FAIL_LINES), "scavvy_line": "I don't think that's quite it."}


@api_router.post("/quest/hint")
async def quest_hint(req: HintReq):
    env = req.environment or {}
    hints = env.get("possibleHints") or ["It's closer than you think.", "Look where people spend the most time.", "It's a very ordinary object."]
    if EMERGENT_LLM_KEY:
        system = ("You are Scavvy giving ONE hint for a scavenger-hunt mission, as if you "
                  "remember the room you scanned. hint_level 1=subtle, 2=specific, 3=almost "
                  "reveal. One short playful sentence. Respond with just the hint text.")
        try:
            import json as _json
            out = await _llm(system, f"Mission: {req.mission_title}\nEnvironment: {_json.dumps(env)[:1000]}\nhint_level: {req.hint_level}")
            if out and len(out.strip()) > 0:
                return {"hint": out.strip().strip('"')}
        except Exception as e:
            logger.warning(f"hint fallback: {e}")
    lvl = max(1, min(3, req.hint_level))
    base = hints[(lvl - 1) % len(hints)]
    prefix = {1: "I remember seeing ", 2: "Think about it — ", 3: "Okay, basically: "}[lvl]
    return {"hint": prefix + base}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
