# Progress Tracker — Scavvy

> Update this file after each completed implementation unit.

## Current Product Direction

Scavvy is an environment-aware AI scavenger/adventure app.

Core differentiator is confirmed:

**scan first → understand environment → generate contextual sidequests**

Repo layout is now **frontend / backend / docs** only.

## Completed / Established

- [x] App name: Scavvy
- [x] Tagline: Your world is the game.
- [x] Mascot direction: original raccoon explorer
- [x] Brand direction: cream + orange + charcoal + yellow
- [x] Main tabs: Home · Adventures · Profile
- [x] Home / Adventures / Profile screens
- [x] Camera-based mission validation
- [x] Environment setup + 3-photo scan
- [x] Environment analysis + quest generation (live or mock)
- [x] Quest selection, reveal, validate, hint
- [x] Play Scavvy audio with bundled fallback
- [x] Expo native tabs (device) + glass tab bar (web)
- [x] Vector icons for functional UI
- [x] Demo fallback if the Node API / OpenAI / ElevenLabs are unavailable

## In Progress

- [ ] Wire a production OpenAI key (optional; mock path works)
- [ ] Wire a production ElevenLabs key (optional; bundled clips work)

## Demo-Critical Test

```text
Open App
→ Home
→ Start Adventure
→ Choose Environment
→ Scan 3 Photos
→ Analyze
→ Receive 3 Contextual Quests
→ Select Quest
→ Find Target
→ Submit Verification Photo
→ Success
→ Hear Scavvy
→ Gain XP
→ Complete Remaining Quests
→ Adventure Complete
→ Home
```

## Known Risks

- Live OpenAI request latency/failure
- ElevenLabs playback failure
- camera permission issues
- broken navigation after mission completion
- UI getting stuck in analyzing/loading state
- overly generic missions if scan context is not passed correctly

## Latest update

### Completed
- Frontend is standalone: mock quests, hints, validation, and bundled voice
- Live API is opt-in via `EXPO_PUBLIC_BACKEND_URL` (empty by default)

### Next
- Run `npx expo start` in `frontend` and play the scan → quest loop

### Risks
- Web camera is limited — use “Use a sample scan” on web
