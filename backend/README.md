# Scavvy Backend

Node.js, Express, TypeScript backend for the Scavvy environment-aware scavenger hunt.

## What it provides

- Accepts guest requests with no authentication or user ID.
- Uses OpenAI vision to derive environment context, generate quests, validate photos, and create hints.
- Generates optional ElevenLabs audio.
- Holds images and context in request memory only; the mobile app owns all progress locally.

The backend does not use a database, store sessions, or retain player data.

## Prerequisites

- Node.js 20+
- Docker Desktop or another Docker-compatible runtime (optional)

## Local setup

```bash
npm install
cp .env.example .env
```

Set your provider credentials in `.env` (optional — the API starts without them and serves mock quests):

```dotenv
PORT=4000
CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081,http://localhost:8082,http://localhost:19006
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-5.6-luna
ELEVENLABS_API_KEY=your-key
ELEVENLABS_VOICE_ID=your-voice-id
```

`CORS_ORIGINS` is an exact allowlist. Never set it to `*` or `null`. Add your Expo web origin if it is not already listed.

Run the API:

```bash
npm run dev
```

For Dockerized API execution, run:

```bash
docker compose up --build api
```

The API is available at `http://localhost:4000`.

## API flow

```bash
curl http://localhost:4000/api/health

curl -X POST http://localhost:4000/api/environment/quests \
  -H 'content-type: application/json' \
  -d '{"location_type":"Home","environment":{"environmentType":"living room"}}'
```

## Tests and build

```bash
npm run test:run
npm run build
```

The tests use in-memory providers and do not call OpenAI or ElevenLabs.
