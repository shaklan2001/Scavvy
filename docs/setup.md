# Setup

Hackathon split:

- **Frontend** — Expo / React Native (this repo folder)
- **Backend** — Node.js, owned by the partner team

The Expo app runs without a backend. Point it at the Node API when that server is ready.

## Requirements

- Node.js 20+
- Expo Go, a simulator, or a browser

## Frontend

```bash
cd frontend
cp .env.example .env
npm install
npx expo start
```

Press `i` (iOS), `a` (Android), or `w` (web).

`EXPO_PUBLIC_BACKEND_URL` is the only public client env var. It is an origin, not a secret.

- Empty → local mocks (default)
- Partner API running locally → `http://localhost:4000`
- Physical device → your machine LAN IP, e.g. `http://192.168.1.20:4000`

## Backend (partner, Node.js)

The partner implements the Node server. Expected contract is in [context/architecture.md](context/architecture.md).

Typical local start (partner decides the exact scripts):

```bash
cd backend
cp .env.example .env
npm install
npm start
```

Secrets stay in `backend/.env`. Do not commit that file.

Suggested env keys for the Node API:

| Key | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | no | `4000` | API port |
| `CORS_ORIGINS` | no | localhost Expo ports | Exact origin allowlist. Never `*` or `null` |
| `OPENAI_API_KEY` | no | empty | Live vision / quests. Empty = mock |
| `ELEVENLABS_API_KEY` | no | empty | Live voice. Empty = Expo bundled clips |
