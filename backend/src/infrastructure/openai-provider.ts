import OpenAI from 'openai';
import { z } from 'zod';
import type { ScavvyAiProvider } from '../domain/ports.js';
import type { EnvironmentContext, GeneratedQuest, ImageInput, LocationType, Quest, VerificationResult } from '../domain/types.js';

interface ResponsesClient {
  responses: {
    create(input: Record<string, unknown>): Promise<{ output_text?: string }>;
  };
}

const environmentContextSchema = z.object({
  environmentType: z.string().min(1),
  visibleObjects: z.array(z.string()),
  colors: z.array(z.string()),
  landmarks: z.array(z.string()),
  possibleQuestTargets: z.array(z.string()),
  possibleHints: z.array(z.string()),
});

const generatedQuestSchema = z.object({
  type: z.enum(['observation', 'visual_clue', 'reasoning']),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  xp: z.number().int().positive(),
});

const verificationSchema = z.object({
  success: z.boolean(),
  confidence: z.number().min(0).max(1),
  explanation: z.string().min(1),
  scavvyReaction: z.string().min(1),
});

export class OpenAiProvider implements ScavvyAiProvider {
  constructor(private readonly client: ResponsesClient, private readonly model = process.env.OPENAI_MODEL ?? 'gpt-5') {}

  async analyzeEnvironment(images: ImageInput[], locationType: LocationType): Promise<EnvironmentContext> {
    const output = await this.requestJson({
      prompt: `Analyze this ${locationType} environment for a scavenger hunt. Identify only safe, non-sensitive objects, colors, landmarks, and useful quest targets. Never identify people, faces, private information, or dangerous/restricted areas. Return JSON with environmentType, visibleObjects, colors, landmarks, possibleQuestTargets, and possibleHints.`,
      images,
      schemaName: 'environment_context',
    });
    return environmentContextSchema.parse(output);
  }

  async generateQuests(context: EnvironmentContext): Promise<GeneratedQuest[]> {
    const output = await this.requestJson({
      prompt: `Using this private environment context, generate exactly three safe, distinct Scavvy quests: one observation, one visual_clue, and one reasoning quest. Require light reasoning instead of simply naming an object. Do not involve strangers, private information, dangerous behavior, or restricted areas. Context: ${JSON.stringify(context)}`,
      schemaName: 'generated_quests',
    });
    const parsedQuests = z.array(generatedQuestSchema).length(3).safeParse(output);
    if (!parsedQuests.success) throw new Error('AI must generate exactly 3 quests');
    const quests = parsedQuests.data;
    const types = new Set(quests.map((quest) => quest.type));
    if (types.size !== 3) throw new Error('AI must generate exactly 3 distinct quest types');
    return quests;
  }

  async validateQuest(quest: Quest, context: EnvironmentContext, image: ImageInput): Promise<VerificationResult> {
    const output = await this.requestJson({
      prompt: `Validate whether this verification photo completes the quest. Return success, confidence from 0 to 1, explanation, and scavvyReaction. Be conservative and reject unsafe or unrelated actions. Quest: ${JSON.stringify(quest)}. Environment context: ${JSON.stringify(context)}`,
      images: [image],
      schemaName: 'verification_result',
    });
    return verificationSchema.parse(output);
  }

  async generateHint(quest: Quest, context: EnvironmentContext, level: number): Promise<string> {
    const output = await this.requestJson({
      prompt: `Generate one short spoken hint at level ${level} for this quest. Use only the stored environment context so the hint feels like Scavvy remembers the room. Do not reveal private information or identify people. Return JSON with a single hint string. Quest: ${JSON.stringify(quest)}. Context: ${JSON.stringify(context)}`,
      schemaName: 'quest_hint',
    });
    return z.object({ hint: z.string().min(1) }).parse(output).hint;
  }

  private async requestJson(input: { prompt: string; images?: ImageInput[]; schemaName: string }): Promise<unknown> {
    const content = [
      { type: 'input_text', text: input.prompt },
      ...(input.images ?? []).map((image) => ({
        type: 'input_image',
        image_url: `data:${image.mimetype};base64,${image.buffer.toString('base64')}`,
      })),
    ];
    const response = await this.client.responses.create({
      model: this.model,
      input: [{ role: 'user', content }],
      text: { format: { type: 'json_schema', name: input.schemaName, strict: true, schema: schemaFor(input.schemaName) } },
    });
    if (!response.output_text) throw new Error('AI returned an empty response');
    try {
      return JSON.parse(response.output_text) as unknown;
    } catch {
      throw new Error('AI returned invalid JSON');
    }
  }
}

function schemaFor(name: string): Record<string, unknown> {
  const quest = {
    type: 'object', additionalProperties: false,
    properties: {
      type: { type: 'string', enum: ['observation', 'visual_clue', 'reasoning'] },
      title: { type: 'string' }, description: { type: 'string' },
      difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }, xp: { type: 'integer' },
    },
    required: ['type', 'title', 'description', 'difficulty', 'xp'],
  };
  if (name === 'generated_quests') return { type: 'array', items: quest, minItems: 3, maxItems: 3 };
  if (name === 'verification_result') return {
    type: 'object', additionalProperties: false,
    properties: { success: { type: 'boolean' }, confidence: { type: 'number' }, explanation: { type: 'string' }, scavvyReaction: { type: 'string' } },
    required: ['success', 'confidence', 'explanation', 'scavvyReaction'],
  };
  if (name === 'quest_hint') return { type: 'object', additionalProperties: false, properties: { hint: { type: 'string' } }, required: ['hint'] };
  return {
    type: 'object', additionalProperties: false,
    properties: {
      environmentType: { type: 'string' }, visibleObjects: { type: 'array', items: { type: 'string' } },
      colors: { type: 'array', items: { type: 'string' } }, landmarks: { type: 'array', items: { type: 'string' } },
      possibleQuestTargets: { type: 'array', items: { type: 'string' } }, possibleHints: { type: 'array', items: { type: 'string' } },
    },
    required: ['environmentType', 'visibleObjects', 'colors', 'landmarks', 'possibleQuestTargets', 'possibleHints'],
  };
}

export function createOpenAiProvider(apiKey: string, model = process.env.OPENAI_MODEL ?? 'gpt-5'): OpenAiProvider {
  return new OpenAiProvider(new OpenAI({ apiKey }) as unknown as ResponsesClient, model);
}
