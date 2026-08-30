import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { createOpenAiProvider } from './infrastructure/openai-provider.js';
import { ElevenLabsProvider } from './infrastructure/elevenlabs-provider.js';

const env = getEnv();
if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required to start the API');

const app = createApp({
  ai: createOpenAiProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL),
  voice: new ElevenLabsProvider({ apiKey: env.ELEVENLABS_API_KEY, voiceId: env.ELEVENLABS_VOICE_ID, model: env.ELEVENLABS_MODEL }),
});

app.listen(env.PORT, () => {
  console.log(`Scavvy API listening on port ${env.PORT}`);
});
