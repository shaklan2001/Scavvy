import crypto from 'node:crypto';
import express, { type Express, type Request } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AdventureService } from './domain/adventure-service.js';
import { QuestService } from './domain/quest-service.js';
import type { ScavvyAiProvider, ScavvyStore, VoiceProvider } from './domain/ports.js';
import type { EnvironmentContext, ImageInput, Quest } from './domain/types.js';
import { errorHandler, HttpError } from './http/errors.js';
import { hintLevelSchema, locationTypeSchema } from './domain/validation.js';
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
  store: ScavvyStore;
  ai: ScavvyAiProvider;
  voice: VoiceProvider;
  maxUploadBytes?: number;
}

const referenceEnvironmentSchema = z.object({
  environmentType: z.string(),
  visibleObjects: z.array(z.string()),
  colors: z.array(z.string()),
  landmarks: z.array(z.string()),
  possibleQuestTargets: z.array(z.string()),
  possibleHints: z.array(z.string()),
}).partial();

function requestImages(request: Request): Express.Multer.File[] {
  return Array.isArray(request.files) ? request.files : [];
}

function toImageInput(file: Express.Multer.File): ImageInput {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    throw new HttpError(400, 'Only JPEG, PNG, and WebP images are accepted');
  }
  return { buffer: file.buffer, mimetype: file.mimetype, originalname: file.originalname };
}

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

export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  const adventureService = new AdventureService(dependencies.store, dependencies.ai);
  const questService = new QuestService(dependencies.store, dependencies.ai, dependencies.voice);
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { files: 3, fileSize: dependencies.maxUploadBytes ?? 5 * 1024 * 1024 },
  });

  app.use(express.json({ limit: '20mb' }));
  app.use((_request, response, next) => {
    const requestId = crypto.randomUUID();
    response.setHeader('x-request-id', requestId);
    next();
  });
  app.use((request, response, next) => {
    response.setHeader('access-control-allow-origin', '*');
    response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
    response.setHeader('access-control-allow-headers', 'content-type');
    if (request.method === 'OPTIONS') return response.sendStatus(204);
    next();
  });

  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

  // Compatibility endpoints let the imported Expo client use its original API
  // contract while the plural resource routes below remain the durable API.
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
    const audio = await dependencies.voice.synthesize(caption);
    if (!audio) return response.sendStatus(204);
    response.json({ audio, caption });
  });

  app.post('/api/environment/analyze', async (request, response) => {
    const body = z.object({
      location_type: z.string().trim().min(1).max(80).default('Home'),
      images: z.array(z.string().max(8 * 1024 * 1024)).max(3).default([]),
    }).parse(request.body);
    const images = decodeReferenceImages(body.images);
    if (images.length > 0 && typeof dependencies.ai.analyzeEnvironment === 'function') {
      try {
        const environment = await dependencies.ai.analyzeEnvironment(images, mapReferenceLocation(body.location_type));
        return response.json({ environment, source: 'vision' });
      } catch {
        // The Expo demo must remain usable when AI credentials or vision are unavailable.
      }
    }
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
      } catch {
        // Fall through to the deterministic no-key demo responses.
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
          xp: body.mission_title.toLowerCase().includes('medium') ? 120 : 100,
          reasoning: result.explanation,
          scavvy_line: result.scavvyReaction,
        });
      } catch {
        // The reference API intentionally keeps its mock result available when AI is unavailable.
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
      } catch {
        // Use the original demo fallback when AI is unavailable.
      }
    }
    response.json({ hint: referenceHint(body.environment, body.hint_level) });
  });

  app.post('/api/adventures', async (request, response) => {
    const body = z.object({ locationType: locationTypeSchema }).parse(request.body);
    const adventure = await adventureService.create(body.locationType);
    response.status(201).json({ adventure });
  });

  app.get('/api/adventures/:id', async (request, response) => {
    response.json(await adventureService.get(request.params.id as string));
  });

  app.post('/api/adventures/:id/scan', upload.array('images', 3), async (request, response) => {
    const files = requestImages(request);
    const images = files.map(toImageInput);
    response.json(await adventureService.scan(request.params.id as string, images));
  });

  app.post('/api/quests/:id/verify', upload.single('image'), async (request, response) => {
    if (!request.file) throw new HttpError(400, 'One verification image is required');
    response.json(await questService.verify(request.params.id as string, toImageInput(request.file)));
  });

  app.post('/api/quests/:id/hint', async (request, response) => {
    const body = z.object({ level: hintLevelSchema, voice: z.boolean().default(false) }).parse(request.body);
    response.json(await questService.hint(request.params.id as string, body.level, body.voice));
  });

  app.post('/api/voice', async (request, response) => {
    const body = z.object({ text: z.string().trim().min(1).max(500) }).parse(request.body);
    response.json({ audioUrl: await dependencies.voice.synthesize(body.text) });
  });

  app.use(errorHandler);
  return app;
}
