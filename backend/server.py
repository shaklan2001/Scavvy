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
