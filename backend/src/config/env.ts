import 'dotenv/config';
import { z } from 'zod';
import { parseCorsOrigins } from '../http/security.js';

const PLACEHOLDER_SECRETS = new Set(['', 'changeme', 'your_api_key', 'your-api-key', 'password123', 'xxx']);

function optionalSecret(value: string): string {
  const trimmed = value.trim();
  return PLACEHOLDER_SECRETS.has(trimmed.toLowerCase()) ? '' : trimmed;
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  OPENAI_API_KEY: z.string().default('').transform(optionalSecret),
  OPENAI_MODEL: z.string().default('gpt-5.6-luna'),
  ELEVENLABS_API_KEY: z.string().default('').transform(optionalSecret),
  ELEVENLABS_VOICE_ID: z.string().default(''),
  ELEVENLABS_MODEL: z.string().default('eleven_multilingual_v2'),
  CORS_ORIGINS: z.string().optional(),
});

export function getEnv() {
  const parsed = envSchema.parse(process.env);
  return {
    ...parsed,
    CORS_ORIGINS: parseCorsOrigins(parsed.CORS_ORIGINS),
    isProduction: parsed.NODE_ENV === 'production',
  };
}
