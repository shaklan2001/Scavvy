import crypto from 'node:crypto';
import express, { type Express } from 'express';
import { z } from 'zod';
import type { ScavvyAiProvider, VoiceProvider } from './domain/ports.js';
import type { EnvironmentContext, Quest } from './domain/types.js';
import { errorHandler } from './http/errors.js';
import { logEvent } from './http/log.js';
import { corsAndSecurity, DEFAULT_CORS_ORIGINS } from './http/security.js';
import {
  analyzeReferenceMission,
  buildReferenceMissions,
  buildReferenceSummary,
  decodeReferenceImages,
  easierReferenceMission,
  fallbackReferenceEnvironment,
  fallbackReferenceQuests,
  mapReferenceLocation,
  referenceHint,
  referenceVoiceText,
  toReferenceQuests,
  validateReferenceQuest,
} from './compat/reference-api.js';

export interface AppDependencies {
  ai: ScavvyAiProvider;
  voice: VoiceProvider;
}

export interface AppOptions {
  corsOrigins?: string[];
  isProduction?: boolean;
}

const referenceEnvironmentSchema = z.object({
  environmentType: z.string(),
  visibleObjects: z.array(z.string()),
  colors: z.array(z.string()),
  landmarks: z.array(z.string()),
  possibleQuestTargets: z.array(z.string()),
  possibleHints: z.array(z.string()),
}).partial();

function temporaryReferenceQuest(title: string): Quest {
  return {
    id: 'reference-compatibility-quest',
    adventureId: 'reference-compatibility-adventure',
    type: 'observation',
    title,
    description: 'A temporary quest used only to satisfy the legacy frontend API.',
    difficulty: 'easy',
    xp: 100,
    status: 'available',
  };
}

function requestIdOf(response: { getHeader(name: string): number | string | string[] | undefined }): string | undefined {
  const value = response.getHeader('x-request-id');
  return typeof value === 'string' ? value : undefined;
}

function fieldFrom(error: unknown, key: 'status' | 'code'): string | number | undefined {
  if (!error || typeof error !== 'object' || !(key in error)) return undefined;
  const value = (error as Record<string, unknown>)[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.length > 0) return value.slice(0, 40);
  return undefined;
}

function safeErrorDetail(error: unknown): string | undefined {
  if (!(error instanceof Error) || !error.message) return undefined;
  return error.message
    .replace(/sk-[a-zA-Z0-9_-]+/g, '[redacted]')
    .replace(/xi-api-key[:\s]*\S+/gi, '[redacted]')
    .slice(0, 160);
}

function logAiFallback(route: string, error: unknown, requestId: string | undefined): void {
  logEvent('warn', 'ai_fallback', {
    route,
    requestId,
    reason: error instanceof Error ? error.name : 'unknown',
    status: fieldFrom(error, 'status'),
    code: fieldFrom(error, 'code'),
    detail: safeErrorDetail(error),
  });
}

export function createApp(dependencies: AppDependencies, options: AppOptions = {}): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(express.json({ limit: '20mb' }));
  app.use((_request, response, next) => {
    response.setHeader('x-request-id', crypto.randomUUID());
    next();
  });
  app.use(corsAndSecurity({
    allowedOrigins: options.corsOrigins ?? DEFAULT_CORS_ORIGINS,
    isProduction: options.isProduction ?? false,
  }));

  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

  // These endpoints are stateless: the guest client supplies its current
  // mission and environment context with every request.
  app.get('/api/', (_request, response) => response.json({ message: 'Scavvy is awake and sniffing around.', ok: true }));

  app.post('/api/adventure/start', (request, response) => {
    const body = z.object({
      name: z.string().trim().min(1).max(80).default('Explorer'),
      personality: z.string().trim().min(1).max(40).default('explorer'),
      style: z.string().trim().min(1).max(40).default('RANDOM'),
    }).parse(request.body);
    response.json({
      id: crypto.randomUUID(),
      name: body.name,
      personality: body.personality,
      style: body.style,
      missions: buildReferenceMissions(body.style, body.personality),
      created_at: new Date().toISOString(),
    });
  });

  app.post('/api/mission/analyze', (request, response) => {
    const body = z.object({
      mission_title: z.string().trim().min(1).max(500),
      mission_index: z.coerce.number().int().min(0).max(99).default(0),
      difficulty: z.string().trim().min(1).max(20).default('Easy'),
      personality: z.string().trim().min(1).max(40).default('explorer'),
      style: z.string().trim().min(1).max(40).default('RANDOM'),
      attempt: z.coerce.number().int().min(1).max(99).default(1),
    }).parse(request.body);
    response.json(analyzeReferenceMission({
      missionTitle: body.mission_title,
      missionIndex: body.mission_index,
      difficulty: body.difficulty,
      attempt: body.attempt,
    }));
  });

  app.post('/api/mission/easier', (request, response) => {
    const body = z.object({ mission_title: z.string().trim().min(1).max(500), style: z.string().optional() }).parse(request.body);
    response.json(easierReferenceMission(body.mission_title));
  });

  app.post('/api/adventure/summary', (request, response) => {
    const body = z.object({
      name: z.string().trim().min(1).max(80).default('Explorer'),
      personality: z.string().trim().min(1).max(40).default('explorer'),
      style: z.string().trim().min(1).max(40).default('RANDOM'),
      missions_completed: z.coerce.number().int().min(0).max(99).default(3),
      total_xp: z.coerce.number().int().min(0).max(100_000).default(300),
    }).parse(request.body);
    response.json(buildReferenceSummary(body.personality, body.missions_completed, body.total_xp));
  });

  app.get('/api/voice', async (request, response) => {
    const line = z.string().optional().parse(request.query.line);
    const caption = line ? referenceVoiceText[line] : undefined;
    if (!caption) return response.sendStatus(204);
    try {
      const audio = await dependencies.voice.synthesize(caption);
      if (!audio) return response.sendStatus(204);
      return response.json({ audio, caption });
    } catch (error) {
      logAiFallback('/api/voice', error, requestIdOf(response));
      return response.sendStatus(204);
    }
  });

  app.post('/api/environment/analyze', async (request, response) => {
    const body = z.object({
      location_type: z.string().trim().min(1).max(80).default('Home'),
      images: z.array(z.string().max(8 * 1024 * 1024)).max(3).default([]),
    }).parse(request.body);
    const images = decodeReferenceImages(body.images);
    const requestId = requestIdOf(response);
    if (body.images.length > 0 && images.length === 0) {
      logEvent('warn', 'analyze_images_rejected', {
        requestId,
        received: body.images.length,
        decoded: 0,
      });
    }
    if (images.length > 0 && typeof dependencies.ai.analyzeEnvironment === 'function') {
      try {
        const environment = await dependencies.ai.analyzeEnvironment(images, mapReferenceLocation(body.location_type));
        return response.json({ environment, source: 'vision' });
      } catch (error) {
        logAiFallback('/api/environment/analyze', error, requestId);
      }
    }
    logEvent('info', 'analyze_using_mock', {
      requestId,
      received: body.images.length,
      decoded: images.length,
    });
    response.json({ environment: fallbackReferenceEnvironment(body.location_type), source: 'mock' });
  });

  app.post('/api/environment/quests', async (request, response) => {
    const body = z.object({
      location_type: z.string().trim().min(1).max(80).default('Home'),
      environment: referenceEnvironmentSchema.optional(),
    }).parse(request.body);
    const environment: EnvironmentContext = { ...fallbackReferenceEnvironment(body.location_type), ...body.environment };
    if (typeof dependencies.ai.generateQuests === 'function') {
      try {
        const generated = await dependencies.ai.generateQuests(environment);
        if (generated.length >= 3) return response.json({ quests: toReferenceQuests(generated), source: 'llm' });
      } catch (error) {
        logAiFallback('/api/environment/quests', error, requestIdOf(response));
      }
    }
    response.json({ quests: fallbackReferenceQuests(environment), source: 'mock' });
  });

  app.post('/api/quest/validate', async (request, response) => {
    const body = z.object({
      mission_title: z.string().trim().min(1).max(500),
      environment: referenceEnvironmentSchema.optional(),
      image: z.string().max(8 * 1024 * 1024).nullable().optional(),
      attempt: z.coerce.number().int().min(1).max(99).default(1),
      difficulty: z.string().trim().min(1).max(20).optional(),
    }).parse(request.body);
    const [image] = body.image ? decodeReferenceImages([body.image]) : [];
    if (image && body.attempt <= 1 && typeof dependencies.ai.validateQuest === 'function') {
      try {
        const result = await dependencies.ai.validateQuest(
          temporaryReferenceQuest(body.mission_title),
          { ...fallbackReferenceEnvironment(), ...body.environment },
          image,
        );
        return response.json({
          success: result.success,
          xp: body.mission_title.toLowerCase().includes('medium') || body.difficulty?.toLowerCase() === 'medium' ? 120 : 100,
          reasoning: result.explanation,
          scavvy_line: result.scavvyReaction,
        });
      } catch (error) {
        logAiFallback('/api/quest/validate', error, requestIdOf(response));
      }
    }
    response.json(validateReferenceQuest(body.mission_title, body.attempt, body.difficulty));
  });

  app.post('/api/quest/hint', async (request, response) => {
    const body = z.object({
      mission_title: z.string().trim().min(1).max(500),
      environment: referenceEnvironmentSchema.optional(),
      hint_level: z.coerce.number().int().min(1).max(3).default(1),
    }).parse(request.body);
    if (typeof dependencies.ai.generateHint === 'function') {
      try {
        const hint = await dependencies.ai.generateHint(
          temporaryReferenceQuest(body.mission_title),
          { ...fallbackReferenceEnvironment(), ...body.environment },
          body.hint_level,
        );
        return response.json({ hint });
      } catch (error) {
        logAiFallback('/api/quest/hint', error, requestIdOf(response));
      }
    }
    response.json({ hint: referenceHint(body.environment, body.hint_level) });
  });

  app.post('/api/voice', async (request, response) => {
    const body = z.object({ text: z.string().trim().min(1).max(500) }).parse(request.body);
    try {
      response.json({ audioUrl: await dependencies.voice.synthesize(body.text) });
    } catch (error) {
      logAiFallback('/api/voice', error, requestIdOf(response));
      response.json({ audioUrl: null });
    }
  });

  app.use(errorHandler);
  return app;
}
