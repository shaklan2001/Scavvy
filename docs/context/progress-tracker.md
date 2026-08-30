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
- [x] Frontend wired to the Node `/api` contract (scan, quests, validate, hint, voice)

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
- Frontend calls the Node API end-to-end: scan analysis, quest generation, validation, hints, summary, and voice
- Scan and verification photos are sent as JPEG data URLs (iPhone processing on; HEIC is not sent to vision)
- Live origin is Metro `/api` in Expo Go (proxied to the Node API), with a fallback to `EXPO_PUBLIC_BACKEND_URL`
- OpenAI quest JSON is an object wrapper; overlapping quest types are kept instead of discarding the live result
- CORS uses an exact origin allowlist via `CORS_ORIGINS`
- ElevenLabs library voices on a free plan return 204; the app plays bundled clips

### Next
- Phone and Mac on the same Wi-Fi; restart Metro after `metro.config.js` or env changes, then reload Expo Go
- `cd backend && npm run dev` then `cd frontend && npx expo start` (LAN, not tunnel)

### Risks
- Web camera is limited — use “Use a sample scan” on web
- Android emulator should use `http://10.0.2.2:4000` instead of localhost
