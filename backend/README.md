# Scavvy Backend

Node.js, Express, TypeScript backend for the Scavvy environment-aware scavenger hunt.

## What it provides

- Creates anonymous adventures with a location type.
- Accepts exactly three environment images in memory.
- Uses OpenAI vision to derive safe environment context and generate three quests.
- Validates one quest photo at a time and awards XP idempotently.
- Generates contextual hints and optional ElevenLabs audio.
- Persists adventure state, derived context, quests, attempts, and hints in Supabase.

Raw images and raw detected-object lists are not persisted or returned by this MVP.

## Prerequisites

- Node.js 20+
- Docker Desktop or another Docker-compatible runtime

Supabase local development runs the complete Supabase stack in Docker. The CLI setup and `supabase start` workflow are documented by [Supabase](https://supabase.com/docs/guides/local-development).

## Local setup

```bash
npm install
npx supabase start
npx supabase status -o env
cp .env.example .env
```

Copy the local `SUPABASE_SERVICE_ROLE_KEY` from the status output into `.env`. For running the API on the host, set:

```dotenv
SUPABASE_URL=http://127.0.0.1:54321
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-5.6-luna
```

Apply the schema:

```bash
npx supabase db reset
```

Run the API:

```bash
npm run dev
```

For Dockerized API execution, change `SUPABASE_URL` in `.env` to `http://host.docker.internal:54321`, then run:

```bash
docker compose up --build api
```

The API is available at `http://localhost:4000`. Supabase Studio is available at `http://localhost:54323`.

## API flow

```bash
curl http://localhost:4000/api/health

curl -X POST http://localhost:4000/api/adventures \
  -H 'content-type: application/json' \
  -d '{"locationType":"office"}'

curl -X POST http://localhost:4000/api/adventures/<adventure-id>/scan \
  -F 'images=@front.jpg' -F 'images=@left.jpg' -F 'images=@right.jpg'

curl http://localhost:4000/api/adventures/<adventure-id>

curl -X POST http://localhost:4000/api/quests/<quest-id>/verify \
  -F 'image=@verification.jpg'

curl -X POST http://localhost:4000/api/quests/<quest-id>/hint \
  -H 'content-type: application/json' \
  -d '{"level":1,"voice":true}'
```

## Tests and build

```bash
npm run test:run
npm run build
```

The tests use in-memory ports and do not call OpenAI, ElevenLabs, or Supabase.
