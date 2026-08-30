# Scavvy Backend Design

## Requirements

Build a Node.js/Express/TypeScript backend for the Scavvy MVP. A player creates an adventure, selects a location type, uploads exactly three environment photos, receives three AI-generated environment-aware quests, verifies each quest with one photo, requests contextual hints, and optionally receives Scavvy voice audio.

Acceptance criteria:

- Given a valid location type, when an adventure is created, then the API returns a persisted adventure in `awaiting_scan` state.
- Given exactly three image files, when a scan is submitted, then the backend analyzes the images, persists private environment context, generates exactly three quests, and returns them without exposing raw object detections.
- Given a quest verification photo, when the AI confidence meets the configured threshold, then the quest becomes `completed`, XP is awarded once, and the adventure becomes `completed` after all three quests are complete.
- Given a hint level from 1 through 3, when a hint is requested, then the hint uses the original environment context and never accepts arbitrary client-supplied context.

## Entities

- `adventures`: anonymous player session, location type, lifecycle status, XP.
- `environment_scans`: one scan per adventure with three image count and server-owned JSON context.
- `quests`: three generated missions belonging to an adventure, with type, difficulty, XP, and status.
- `quest_attempts`: immutable verification outcomes and confidence values.
- `hints`: generated hint text and optional audio reference.

## Approach

The mobile client calls only this backend. The backend owns Supabase service credentials and calls OpenAI for vision/structured JSON and ElevenLabs for optional text-to-speech. Scan and verification images are held in memory for the request and are not persisted in the MVP; only derived environment context and validation results are stored.

The HTTP layer is dependency-injected with repository and AI ports so route tests use deterministic in-memory adapters. The production adapter uses `@supabase/supabase-js`, OpenAI Responses API, and ElevenLabs HTTP TTS.

## Structure

- `src/app.ts`: Express app, middleware, routes, and error mapping.
- `src/config/env.ts`: validated environment configuration.
- `src/domain/`: input validation, domain types, and service orchestration.
- `src/infrastructure/`: Supabase, OpenAI, and ElevenLabs adapters.
- `supabase/migrations/`: schema tracked as SQL migrations.
- `docker-compose.yml`: API container; Supabase local stack is started with the Supabase CLI and Docker.

## Operations

- `POST /api/adventures` with `{ locationType }`.
- `POST /api/adventures/:id/scan` with multipart field `images` containing exactly three images.
- `GET /api/adventures/:id` returns progress and quests.
- `POST /api/quests/:id/verify` with multipart field `image`.
- `POST /api/quests/:id/hint` with `{ level: 1 | 2 | 3, voice?: boolean }`.
- `POST /api/voice` with `{ text }` returns an audio URL or `null` when voice is not configured.
- `GET /api/health` returns service status.

## Norms

- TypeScript strict mode, async/await, Zod validation, consistent JSON errors, and request IDs.
- No API keys in the client or repository.
- All external AI responses are validated before persistence.
- HTTP tests cover success, validation, not-found, and external failure paths.

## Safeguards

- Only safe environment context is requested: no person identification, private information, strangers, dangerous actions, or restricted areas.
- Raw environment detections are never returned by the API.
- Upload count, MIME type, and file size are bounded.
- Quest completion is idempotent: a completed quest cannot award XP twice.
- No AR, GPS, continuous video, SLAM, multiplayer, or authentication is in scope for this MVP.
