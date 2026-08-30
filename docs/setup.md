# Setup

Hackathon split:

- **Frontend** — Expo / React Native (this repo folder)
- **Backend** — Node.js, owned by the partner team

The Expo app talks to the Node API in development (`http://localhost:4000`). If that server is down, gameplay continues on local mocks.

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

- `http://localhost:4000` → simulator / web
- Empty production build → local mocks
- Android emulator → `http://10.0.2.2:4000`
- Physical phone (Expo Go) → `http://YOUR_WIFI_IP:4000`

On device, the app calls Metro (`http://YOUR_WIFI_IP:8081/api`). Metro proxies those requests to `http://127.0.0.1:4000`. Phone and computer must be on the same Wi-Fi. Do not use Expo tunnel mode for the API.

Restart Metro after changing `metro.config.js` or `EXPO_PUBLIC_BACKEND_URL`.

## Backend (partner, Node.js)

The Node API lives in `backend/`. Contract is in [context/architecture.md](context/architecture.md).

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Secrets stay in `backend/.env`. Do not commit that file. OpenAI and ElevenLabs keys are optional; empty keys serve deterministic mock quests and skip live voice.

Suggested env keys for the Node API:

| Key | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | no | `4000` | API port |
| `CORS_ORIGINS` | no | localhost Expo ports | Exact origin allowlist. Never `*` or `null` |
| `OPENAI_API_KEY` | no | empty | Live vision / quests. Empty = mock |
| `ELEVENLABS_API_KEY` | no | empty | Live voice. Empty = Expo bundled clips |
