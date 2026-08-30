import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import type { ScavvyAiProvider } from './domain/ports.js';
import { createOpenAiProvider } from './infrastructure/openai-provider.js';
import { ElevenLabsProvider } from './infrastructure/elevenlabs-provider.js';
import { logEvent } from './http/log.js';

const unconfiguredAi: ScavvyAiProvider = {
  analyzeEnvironment: async () => {
    throw new Error('AI provider is not configured');
  },
  generateQuests: async () => {
    throw new Error('AI provider is not configured');
  },
  validateQuest: async () => {
    throw new Error('AI provider is not configured');
  },
  generateHint: async () => {
    throw new Error('AI provider is not configured');
  },
};

const env = getEnv();
const app = createApp({
  ai: env.OPENAI_API_KEY ? createOpenAiProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL) : unconfiguredAi,
  voice: new ElevenLabsProvider({ apiKey: env.ELEVENLABS_API_KEY, voiceId: env.ELEVENLABS_VOICE_ID, model: env.ELEVENLABS_MODEL }),
}, { corsOrigins: env.CORS_ORIGINS, isProduction: env.isProduction });

if (!env.OPENAI_API_KEY) {
  logEvent('info', 'ai_unconfigured', { message: 'OPENAI_API_KEY is not set; environment and quest routes will use mock fallbacks' });
}

app.listen(env.PORT, "0.0.0.0", () => {
  logEvent("info", "server_listening", { port: env.PORT, host: "0.0.0.0" });
});
