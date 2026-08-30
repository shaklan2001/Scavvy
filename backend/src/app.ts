import crypto from 'node:crypto';
import express, { type Express, type Request } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AdventureService } from './domain/adventure-service.js';
import { QuestService } from './domain/quest-service.js';
import type { ScavvyAiProvider, ScavvyStore, VoiceProvider } from './domain/ports.js';
import type { ImageInput } from './domain/types.js';
import { errorHandler, HttpError } from './http/errors.js';
import { hintLevelSchema, locationTypeSchema } from './domain/validation.js';

export interface AppDependencies {
  store: ScavvyStore;
  ai: ScavvyAiProvider;
  voice: VoiceProvider;
  maxUploadBytes?: number;
}

function requestImages(request: Request): Express.Multer.File[] {
  return Array.isArray(request.files) ? request.files : [];
}

function toImageInput(file: Express.Multer.File): ImageInput {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    throw new HttpError(400, 'Only JPEG, PNG, and WebP images are accepted');
  }
  return { buffer: file.buffer, mimetype: file.mimetype, originalname: file.originalname };
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  const adventureService = new AdventureService(dependencies.store, dependencies.ai);
  const questService = new QuestService(dependencies.store, dependencies.ai, dependencies.voice);
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { files: 3, fileSize: dependencies.maxUploadBytes ?? 5 * 1024 * 1024 },
  });

  app.use(express.json({ limit: '1mb' }));
  app.use((_request, response, next) => {
    const requestId = crypto.randomUUID();
    response.setHeader('x-request-id', requestId);
    next();
  });

  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

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
