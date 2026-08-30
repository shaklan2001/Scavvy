import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().default('gpt-5'),
  ELEVENLABS_API_KEY: z.string().default(''),
  ELEVENLABS_VOICE_ID: z.string().default(''),
  ELEVENLABS_MODEL: z.string().default('eleven_multilingual_v2'),
  SUPABASE_URL: z.string().url().default('http://127.0.0.1:54321'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
});

export function getEnv() {
  return envSchema.parse(process.env);
}
