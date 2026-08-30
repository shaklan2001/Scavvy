# Scavvy Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a Docker-ready Node/Express/TypeScript API backed by a local Supabase Docker stack for the Scavvy environment-aware scavenger hunt.

**Architecture:** A thin Express HTTP layer calls domain services through repository and provider ports. Supabase stores adventures, scans, quests, attempts, and hints; OpenAI analyzes images and produces JSON missions; ElevenLabs optionally produces voice audio.

**Tech Stack:** Node.js, TypeScript, Express, Zod, Vitest, Supertest, Supabase JS, OpenAI SDK, ElevenLabs REST, Supabase CLI/Docker.

**Spec:** `docs/superpowers/specs/2026-08-30-scavvy-backend-design.md`

## Global Constraints

- Exactly three environment images per scan.
- One verification image per quest attempt.
- Do not persist raw images in the MVP.
- Do not expose raw detected-object lists.
- Do not identify people or generate unsafe/restricted missions.
- AI keys remain server-side.
- All TypeScript is strict and all route inputs are validated.

---

### Task 1: Project and test foundation

**Files:**
- Create: `package.json`, `tsconfig.json`, `.env.example`, `.gitignore`, `vitest.config.ts`
- Create: `tests/domain/validation.test.ts`

- [ ] Write failing validation tests for location types, three-image enforcement, and hint levels.
- [ ] Run `npm test -- --run tests/domain/validation.test.ts` and confirm failure because validation modules do not exist.
- [ ] Add strict project configuration and minimal validation module.
- [ ] Run the targeted tests and confirm they pass.

### Task 2: Domain ports and Supabase schema

**Files:**
- Create: `src/domain/types.ts`, `src/domain/ports.ts`
- Create: `supabase/config.toml`, `supabase/migrations/20260830120000_initial_schema.sql`
- Create: `src/infrastructure/supabase-repository.ts`

- [ ] Define typed domain entities and repository/provider interfaces used by services.
- [ ] Add SQL tables, constraints, indexes, and updated-at triggers for the five domain entities.
- [ ] Implement repository methods with Supabase service-role access.
- [ ] Run TypeScript compilation and repository unit tests.

### Task 3: AI and voice adapters

**Files:**
- Create: `src/infrastructure/openai-provider.ts`, `src/infrastructure/elevenlabs-provider.ts`
- Create: `tests/infrastructure/provider-contracts.test.ts`

- [ ] Write provider contract tests for safe context, exactly three quests, validation, hints, and voice fallback.
- [ ] Run them red against missing providers.
- [ ] Implement OpenAI Responses API JSON parsing/validation and ElevenLabs TTS with an unconfigured fallback.
- [ ] Run provider tests and TypeScript compilation.

### Task 4: Adventure and quest services

**Files:**
- Create: `src/domain/adventure-service.ts`, `src/domain/quest-service.ts`
- Create: `tests/domain/services.test.ts`

- [ ] Write failing service tests for scan orchestration, XP idempotency, adventure completion, and contextual hints.
- [ ] Run them red.
- [ ] Implement service orchestration against the ports.
- [ ] Run service tests and refactor while green.

### Task 5: Express API

**Files:**
- Create: `src/app.ts`, `src/server.ts`, `src/http/errors.ts`
- Create: `tests/http/app.test.ts`

- [ ] Write failing HTTP tests for all public routes and error responses.
- [ ] Run them red.
- [ ] Implement validation, multipart upload limits, request IDs, routes, and error middleware.
- [ ] Run all tests and compile the app.

### Task 6: Docker and documentation

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `README.md`

- [ ] Document Supabase CLI/Docker startup, environment variables, migrations, and curl examples.
- [ ] Add a production-like multi-stage API image and health check.
- [ ] Run the full test suite, build, and Docker configuration validation.

