# Architecture — Scavvy

## Repo layout

```text
frontend/   Expo Router + TypeScript (this team)
backend/    Node.js API (partner team)
docs/       required.md + context/
```

The Expo app talks to the Node server through `EXPO_PUBLIC_BACKEND_URL`.  
On a physical phone, Expo Go talks to Metro (`http://YOUR_WIFI_IP:8081`) and Metro proxies `/api` to the Node server on port 4000. That avoids iOS blocking cleartext HTTP to port 4000.

Scan photos and verification photos are sent as JPEG/PNG/WebP data URLs in the JSON body. They are not stored on the server.

Secrets stay in `backend/.env`. Never put OpenAI or ElevenLabs keys in the Expo client.

## Stack

Frontend:

- React Native
- Expo
- Expo Router
- TypeScript
- Expo Camera
- Expo-compatible vector/native icon system
- Expo native tabs and/or BlurView where appropriate

Backend (partner):

- Node.js
- Express (or equivalent Node HTTP server)
- Not FastAPI / not Python

External AI services (server-side only):

- OpenAI for vision, reasoning, quest generation, validation, summaries, and hints
- ElevenLabs for Scavvy voice

## Node API contract

The Expo client already calls these routes under `/api`. The Node backend should match them.

| Method | Path | Body / query | Used for |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Liveness |
| GET | `/api/` | — | Friendly health check |
| POST | `/api/adventure/start` | `{ name, personality, style }` | Start a session |
| POST | `/api/environment/analyze` | `{ location_type, images }` | Read 3 scan photos |
| POST | `/api/environment/quests` | `{ location_type, environment }` | Create 3 quests |
| POST | `/api/quest/validate` | `{ mission_title, environment, image, attempt, difficulty }` | Check a find |
| POST | `/api/quest/hint` | `{ mission_title, environment, hint_level }` | Ask Scavvy |
| POST | `/api/mission/analyze` | `{ mission_title, mission_index, difficulty, personality, style, attempt }` | Legacy validate |
| POST | `/api/mission/easier` | `{ mission_title, style }` | Easier mission |
| POST | `/api/adventure/summary` | `{ name, personality, style, missions_completed, total_xp }` | End card |
| GET | `/api/voice?line=` | `mission_intro` / `success` / `failure` / `adventure_complete` | Spoken line |

If a route is missing or fails, the Expo app falls back to local mock data and bundled voice clips. The demo must never stall.

CORS must use an exact origin allowlist from `CORS_ORIGINS` (Expo web is typically `http://localhost:8081`). Do not use `*` or `null`. Native Expo clients often send no `Origin` header; those requests are not CORS-gated.

## Architecture Principles

- mobile-first
- simple enough for hackathon delivery
- API keys stay server-side
- UI can run fully in demo/mock mode
- AI integrations sit behind service interfaces
- gameplay state is centralized
- screens do not directly contain provider-specific API logic

## Suggested Folder Shape

```text
app/
  (tabs)/
    index.tsx
    adventures.tsx
    profile.tsx
  adventure/
    setup.tsx
    scan.tsx
    analyzing.tsx
    quests.tsx
    mission.tsx
    camera.tsx
    validating.tsx
    success.tsx
    complete.tsx

src/
  components/
  features/
    adventure/
    achievements/
    profile/
  services/
    ai/
    audio/
  store/
  data/
  theme/
  types/
```

Use the existing repository structure if one already exists. Do not reorganize the project solely to match this example.

## Core Service Interfaces

Keep provider calls behind functions such as:

```ts
analyzeEnvironment(images, locationType)
generateEnvironmentQuests(environmentContext)
validateQuestCompletion(verificationImage, mission, environmentContext)
generateHint(mission, environmentContext, hintLevel)
generateScavvyResponse(event, context)
generateAdventureSummary(adventure)
playScavvyVoice(text, voiceContext)
```

Names can adapt to the existing codebase, but responsibilities should remain separated.

## Environment Context

Suggested shape:

```ts
type EnvironmentContext = {
  locationType: 'home' | 'office' | 'campus' | 'outdoors' | 'other';
  visibleObjects: string[];
  colors: string[];
  landmarks: string[];
  possibleQuestTargets: string[];
  possibleHints: string[];
};
```

Do not include person identity.

## Quest

Suggested shape:

```ts
type Quest = {
  id: string;
  type: 'observation' | 'reasoning' | 'visual_clue' | 'quick';
  title: string;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  hintLevels: string[];
  status: 'available' | 'active' | 'complete';
};
```

## Adventure State

Suggested centralized state:

```ts
type AdventureState = {
  id: string;
  locationType: string | null;
  scanImages: string[];
  environment: EnvironmentContext | null;
  quests: Quest[];
  activeQuestId: string | null;
  completedQuestIds: string[];
  xpEarned: number;
  startedAt: number | null;
  isActive: boolean;
};
```

The implementation may use Context, Zustand, Redux, or another already-present state solution.

Do not add a new state library unless necessary.

## Mock / Live Mode

All AI functions should support:

- live provider path
- deterministic fallback path

The UI should not need to know whether output came from live AI or mock mode.

## Audio

Audio service must prevent overlapping playback.

Expected states:

- idle
- loading/generating
- playing
- error/fallback

If ElevenLabs fails, use a local bundled audio clip or another reliable demo-safe fallback.

## Navigation Invariants

- Main tabs: Home, Adventures, Profile
- Gameplay hides main tabs
- Every immersive screen has a valid exit/back path unless intentionally blocked for a short critical loading step
- Adventure state survives between gameplay routes
- Returning Home should not crash if an adventure was partially completed

## Security

- Never hardcode OpenAI or ElevenLabs secret keys into client code
- Read secrets through secure server-side/env configuration
- Do not log secrets
- Do not send unnecessary personal/sensitive data to AI providers
- Do not ask AI to identify people in environment scans

## Performance

MVP environment analysis uses 3 still images.

Avoid:

- continuous video upload
- excessive image resolution
- sending duplicate images
- repeated AI calls when cached context is available

## Verification

Before major changes:

- confirm current navigation works
- confirm camera permissions flow works
- confirm mock mode can complete a full adventure
