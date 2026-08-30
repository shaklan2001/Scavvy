# Scavvy — Product Requirements & Build Log

## Original Problem Statement
Build "Scavvy", a playful AI-powered real-world adventure/scavenger-hunt mobile app.
Tagline: "Your world is the game." A raccoon mascot (Scavvy) is the PRIMARY visual
identity and must appear as a transparent character cutout across every screen, in the
exact supplied art style. Palette: cream + charcoal + orange with yellow accents.
Feel: modern mobile game + premium consumer app + AI companion (NOT generic SaaS/chatbot).
Core loop: START → MISSION → CAMERA → AI understands → Scavvy reacts → NEXT → REWARD.

## User Choices (this build)
- AI features: **mock** (no OpenAI keys) — clean service interfaces for later wiring.
- Voice (ElevenLabs): **mock** "Play Scavvy" button (haptic + caption toast).
- Auth: **none** — capture Name locally; "Continue with Google" visual-only.
- Mascot: cropped transparent poses from the supplied artwork sheets.

## Architecture
- **Frontend:** Expo Router (React Native), Plus Jakarta Sans (self-hosted via expo-font),
  React Native `Animated` for motion, expo-camera, expo-image-picker, expo-location,
  react-native-keyboard-controller. State via `ScavvyContext` + local storage.
- **Backend:** FastAPI mock AI service (`/api/adventure/*`, `/api/mission/*`), Mongo for
  optional adventure persistence. All endpoints degrade to local fallbacks (never stuck).
- **Mascot pipeline:** rembg (u2net) background removal + edge-detail segmentation to
  extract 30 transparent poses/props into `/app/frontend/assets/mascot/`.

## Mascot Asset System
`<ScavvyMascot pose="..." size=... anim=... />` with poses: welcome, idle, thinking,
curious, excited, success, confused, sad(→confused), sleeping, celebrating, detective,
exploring, camera, map, running, peek + 8 face variants. Plus `ScavvyProp` and `ScavvyLogo`.
Missing poses fall back to the closest available one.

## Implemented (2026-08-30)
- Splash with animated paw trail + logo; routes to onboarding or home.
- Onboarding: Welcome, Look, Sign up (Scavvy reacts to focused field), Personality (2×2),
  Adventure Style (default RANDOM), Camera + Location permission screens (contextual,
  pre-explained, Open-Settings fallback on block).
- Home: greeting, mascot + speech bubble, Today's Adventure card, progress (streak/missions/level).
- Tabs: Home / Adventures / Profile.
- Mission loop: Reveal (game-like), Camera (minimal UI, tiny companion, torch/gallery,
  web sample fallback), Analyzing (scanning sweep + cycling copy), Success (confetti, XP,
  Play Scavvy), Failure (playful, Try Again / Make it easier), Adventure Complete (dark,
  confetti, stats, AI summary, trait bars, Share, Go Again).
- Seeded starting stats (4 streak / 27 missions / Lv 3) for an alive first impression.
- Verified end-to-end on 390×844; backend 9/9 tests pass; failure→retry contract confirmed.

## Personas
- Casual explorers who want quick, delightful real-world play sessions.
- Personality archetypes: Detective, Explorer, Creative, Chaos Agent.

## Backlog / Remaining
- P1: Wire real OpenAI Vision into `analyzeImage()` + mission generation (server-side keys).
- P1: Wire real ElevenLabs narration behind the "Play Scavvy" button.
- P2: Persist completed adventures + a history view in Adventures tab.
- P2: Location-aware missions (permission already wired).
- P3: Address RN-Web console deprecations (shadow*, pointerEvents) — cosmetic only.

## Next Tasks
1. Integrate OpenAI Vision for real photo validation.
2. Integrate ElevenLabs voice for Scavvy reactions.
3. Adventure history + shareable result card image.

## Polish + Reliability Pass (2026-08-30)
- Replaced all functional-UI emoji with consistent Ionicons (flame/star/compass, star XP,
  volume for audio, chevrons). Removed 👋/👀/🎉/🔊/🔥 from chrome.
- Premium glassmorphism floating tab bar (`GlassTabBar` + expo-blur): rounded, translucent,
  active orange pill; tab bar hidden on immersive mission screens.
- In-app navigation: Back "Home" on Success + Adventure Complete, "Back" on Mission Reveal,
  X close on Camera. GO AGAIN now starts a brand-new adventure → Reveal.
- Mission Success reward reveal: staged animation (mascot pop → THAT COUNTS! → animated XP
  counter → MISSION COMPLETE) + confetti; captured image in a 24px rounded card.
- **Play Scavvy is audible**: `voice` service (expo-audio) plays real speech. Runtime tries
  backend `GET /api/voice` (ElevenLabs when `ELEVENLABS_API_KEY` set) and falls back to 4
  bundled OpenAI-TTS clips (mission_intro/success/failure/adventure_complete) so it always
  makes sound. Single-playback guard, "SCAVVY IS SPEAKING…" state + speaker pulse, tappable
  speech bubble. Auto-plays on reveal/success/failure/complete.
- Verified: backend 14/14 tests pass; flows A–D pass end-to-end on web preview.
- Env added (backend/.env): `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (empty → fallback).

## Native Tabs (2026-08-30)
- Bottom tabs now use **Expo Router native tabs** (`expo-router/unstable-native-tabs`) on
  device: `app/(tabs)/_layout.tsx` renders `NativeTabs` with SF Symbols (house/safari/
  person.crop.circle) on iOS — Liquid Glass on iOS 26, native blur on 18+ — and Ionicons via
  `VectorIcon` on Android (Material). Brand tint = orange.
- `app/(tabs)/_layout.web.tsx` keeps the custom floating glassmorphism `GlassTabBar` for the
  web preview (native system tabs have no web equivalent). Tab-screen bottom padding is
  platform-gated (web clears the floating bar; native relies on the system bar + auto insets).
- Verified: web regression (iteration_3) passes — tab switching + full adventure loop intact.
