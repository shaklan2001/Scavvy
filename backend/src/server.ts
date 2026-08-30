import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { createOpenAiProvider } from './infrastructure/openai-provider.js';
import { ElevenLabsProvider } from './infrastructure/elevenlabs-provider.js';
import { createSupabaseRepository } from './infrastructure/supabase-repository.js';

const env = getEnv();
if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required to start the API');
if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to start the API');

const app = createApp({
  store: createSupabaseRepository(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
  ai: createOpenAiProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL),
  voice: new ElevenLabsProvider({ apiKey: env.ELEVENLABS_API_KEY, voiceId: env.ELEVENLABS_VOICE_ID, model: env.ELEVENLABS_MODEL }),
  maxUploadBytes: env.MAX_UPLOAD_BYTES,
});

app.listen(env.PORT, () => {
  console.log(`Scavvy API listening on port ${env.PORT}`);
});
