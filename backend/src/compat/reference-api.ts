import crypto from 'node:crypto';
import type { EnvironmentContext, ImageInput, LocationType, QuestDifficulty, QuestType } from '../domain/types.js';

export interface ReferenceMission {
  index: number;
  title: string;
  hint: string;
  difficulty: 'Easy' | 'Medium';
}

export interface ReferenceEnvironment extends EnvironmentContext {}

const missionPools = {
  MYSTERY: [
    'Find something that looks completely ordinary but has a secret purpose.',
    "Find something that's hiding in plain sight.",
    'Find something older than it looks.',
    'Find a clue that something happened here before you arrived.',
    'Find something that keeps a secret.',
    "Find something that has clearly been somewhere it shouldn't.",
  ],
  DISCOVERY: [
    "Find something nearby that makes someone's life easier.",
    'Find something you walk past every day but never really see.',
    'Find something that has been waiting longer than you have.',
    'Find something designed by a person who really cared.',
    'Find the most ignored object around you.',
    'Find something that quietly does an important job.',
  ],
  CHAOS: [
    "Find something blue that doesn't belong here.",
    'Find the most dramatic object within reach.',
    'Find something that would make a terrible gift.',
    'Find something pretending to be something else.',
    'Find the strangest texture near you.',
    'Find something that looks way too proud of itself.',
  ],
} as const;

const hints = [
  "Don't overthink it.",
  'Trust your gut.',
  'First thing you see counts.',
  'Scavvy trusts you.',
  'The obvious answer is usually the fun one.',
];

const successLines = [
  'Yep. That absolutely counts. Suspiciously good taste.',
  'A fine specimen. Scavvy approves.',
  'Ooh, sneaky choice. I like how your brain works.',
  'That? That\'s exactly the kind of thing I meant.',
  'Case closed. You noticed what most people miss.',
  "Textbook find. You've clearly done this before.",
];

const failureLines = [
  'Technically... everything makes you wait if you\'re patient enough.',
  'Bold interpretation. I respect it, but no.',
  'I see what you did there. I just don\'t agree with it.',
  'Close! In a parallel universe, that totally works.',
  'Interesting evidence, detective. Not quite the case though.',
];

const detected = [
  'One suspicious object detected',
  'Something interesting spotted',
  'A curious little discovery',
  'One very photogenic subject',
];

const easyMissions = [
  "Find literally anything orange. That's it. That's the mission.",
  'Find something round. Scavvy loves round things.',
  'Find something soft you could nap on.',
  'Find something with a face (real or imaginary).',
  'Find something that makes a sound.',
];

const personaTraits = {
  detective: { explorer: 78, observation: 95, curiosity: 90, chaos: 45 },
  explorer: { explorer: 96, observation: 80, curiosity: 88, chaos: 55 },
  creative: { explorer: 82, observation: 84, curiosity: 93, chaos: 70 },
  chaos: { explorer: 80, observation: 72, curiosity: 86, chaos: 95 },
} as const;

const summaryLines = {
  detective: "You're surprisingly good at noticing ordinary things.",
  explorer: 'You treat every corner like it owes you a discovery.',
  creative: 'You find stories in objects most people ignore.',
  chaos: "You picked the weirdest possible answers. I'm impressed and concerned.",
} as const;

const fallbackEnvironments: Record<string, ReferenceEnvironment> = {
  Home: {
    environmentType: 'a cosy home',
    visibleObjects: ['mug', 'lamp', 'remote control', 'houseplant', 'book', 'charger'],
    colors: ['warm brown', 'cream', 'green'],
    landmarks: ['sofa', 'window'],
    possibleQuestTargets: ['remote control', 'houseplant', 'mug'],
    possibleHints: ['near where people relax', 'something that needs water'],
  },
  Office: {
    environmentType: 'a busy office',
    visibleObjects: ['laptop', 'whiteboard', 'coffee cup', 'monitor', 'sticky notes', 'backpack'],
    colors: ['grey', 'blue', 'white'],
    landmarks: ['desk', 'meeting board'],
    possibleQuestTargets: ['whiteboard', 'laptop', 'coffee cup'],
    possibleHints: ['people look at it in meetings', 'useless without electricity'],
  },
  Campus: {
    environmentType: 'a university campus',
    visibleObjects: ['backpack', 'notebook', 'water bottle', 'projector', 'bench', 'poster'],
    colors: ['blue', 'green', 'white'],
    landmarks: ['lecture board', 'noticeboard'],
    possibleQuestTargets: ['projector', 'water bottle', 'poster'],
    possibleHints: ['helps a big group see', 'keeps you hydrated'],
  },
  Outdoors: {
    environmentType: 'an outdoor space',
    visibleObjects: ['tree', 'bench', 'sign', 'bicycle', 'trash bin', 'streetlight'],
    colors: ['green', 'grey', 'brown'],
    landmarks: ['path', 'signpost'],
    possibleQuestTargets: ['sign', 'bench', 'streetlight'],
    possibleHints: ['tells you where to go', 'lights up at night'],
  },
  'Somewhere Else': {
    environmentType: 'an interesting space',
    visibleObjects: ['chair', 'bottle', 'bag', 'phone', 'clock', 'cup'],
    colors: ['mixed'],
    landmarks: ['corner', 'table'],
    possibleQuestTargets: ['clock', 'bottle', 'bag'],
    possibleHints: ['it keeps track of time', 'you carry things in it'],
  },
};

export const referenceVoiceText: Record<string, string> = {
  mission_intro: 'Alright explorer. Your next mission starts now. Eyes open.',
  success: "That counts! Nice work. Let's make the next one harder.",
  failure: "Hmm, nice try. I don't think that's quite what I was looking for.",
  adventure_complete: 'You did it! Three missions complete. Not bad, detective.',
};

function boundedHash(...parts: Array<string | number>): number {
  const hex = crypto.createHash('sha256').update(parts.join('::')).digest('hex').slice(0, 8);
  return Number.parseInt(hex, 16) >>> 0;
}

function pick<T>(values: readonly T[], ...seed: Array<string | number>): T {
  return values[boundedHash(...seed) % values.length] as T;
}

function shuffled<T>(values: readonly T[], ...seed: Array<string | number>): T[] {
  const result = [...values];
  let state = boundedHash(...seed) || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const other = state % (index + 1);
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

export function buildReferenceMissions(style: string, personality: string): ReferenceMission[] {
  const normalizedStyle = style.toUpperCase();
  const pool = normalizedStyle in missionPools
    ? missionPools[normalizedStyle as keyof typeof missionPools]
    : Object.values(missionPools).flat();
  const titles = shuffled(pool, normalizedStyle, personality, crypto.randomUUID()).slice(0, 3);
  return titles.map((title, index) => ({
    index,
    title,
    hint: pick(hints, title, personality),
    difficulty: index < 2 ? 'Easy' : 'Medium',
  }));
}

export function analyzeReferenceMission(input: {
  missionTitle: string;
  missionIndex: number;
  difficulty: string;
  attempt: number;
}): { success: boolean; xp: number; detected: string; reasoning: string; scavvy_line: string } {
  const seed = boundedHash(input.missionTitle, input.missionIndex, input.attempt);
  const success = input.attempt > 1 || (seed / 0x1_0000_0000) > 0.25;
  const objectDetected = pick(detected, input.missionTitle, input.missionIndex, input.attempt);
  if (!success) {
    const reasoning = pick(failureLines, input.missionTitle, input.attempt);
    return { success: false, xp: 0, detected: objectDetected, reasoning, scavvy_line: "I don't think that's quite what I was looking for." };
  }

  const title = input.missionTitle.toLowerCase();
  const line = title.includes('easier') || title.includes('life easier')
    ? "Yep — that definitely makes someone's life easier."
    : title.includes('blue')
      ? "That's about as blue as it gets. Sneaky. I like it."
      : title.includes('waiting')
        ? 'Oh, that has absolutely been waiting. Patient little thing.'
        : pick(successLines, input.missionTitle, input.attempt);
  return {
    success: true,
    xp: input.difficulty.toLowerCase() === 'medium' ? 120 : 100,
    detected: objectDetected,
    reasoning: line,
    scavvy_line: line,
  };
}

export function easierReferenceMission(missionTitle: string): ReferenceMission {
  return {
    index: 0,
    title: pick(easyMissions, missionTitle, 'easier'),
    hint: 'Okay okay, I made it easy. Go.',
    difficulty: 'Easy',
  };
}

export function buildReferenceSummary(personality: string, missionsCompleted: number, totalXp: number) {
  const key = personality.toLowerCase() in personaTraits ? personality.toLowerCase() as keyof typeof personaTraits : 'explorer';
  const base = personaTraits[key];
  const traits = Object.fromEntries(Object.entries(base).map(([trait, score]) => {
    const variation = (boundedHash(key, totalXp, missionsCompleted, trait) % 13) - 6;
    return [trait, Math.max(45, Math.min(99, score + variation))];
  }));
  return {
    headline: 'ADVENTURE COMPLETE',
    summary: summaryLines[key],
    traits,
    total_xp: totalXp,
    streak_delta: 1,
  };
}

export function fallbackReferenceEnvironment(locationType?: string): ReferenceEnvironment {
  const direct = fallbackEnvironments[locationType ?? 'Home'];
  const caseInsensitive = Object.entries(fallbackEnvironments)
    .find(([name]) => name.toLowerCase() === (locationType ?? '').toLowerCase())?.[1];
  const environment = direct ?? caseInsensitive ?? fallbackEnvironments.Home;
  return structuredClone(environment);
}

export function mapReferenceLocation(locationType?: string): LocationType {
  switch (locationType?.toLowerCase()) {
    case 'home': return 'home';
    case 'office': return 'office';
    case 'campus': return 'campus';
    case 'outdoors': return 'outdoors';
    default: return 'other';
  }
}

export function decodeReferenceImages(images: string[]): ImageInput[] {
  return images.slice(0, 3).flatMap((image, index) => {
    const dataUrl = /^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(image);
    const encoded = dataUrl?.[2] ?? (/^[a-zA-Z0-9+/=]+$/.test(image) ? image : undefined);
    if (!encoded) return [];
    const buffer = Buffer.from(encoded, 'base64');
    if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) return [];
    return [{ buffer, mimetype: dataUrl?.[1] ?? 'image/jpeg', originalname: `environment-${index + 1}` }];
  });
}

function asTitleCase(value: string): 'Easy' | 'Medium' | 'Hard' {
  if (value.toLowerCase() === 'hard') return 'Hard';
  if (value.toLowerCase() === 'medium') return 'Medium';
  return 'Easy';
}

function toReferenceType(value: QuestType): 'observation' | 'reasoning' | 'visual' {
  return value === 'visual_clue' ? 'visual' : value;
}

export function toReferenceQuests(quests: Array<{
  type: QuestType;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  xp: number;
}>) {
  return quests.slice(0, 3).map((quest, index) => ({
    id: `q${index + 1}`,
    type: toReferenceType(quest.type),
    title: quest.title,
    hint: quest.description,
    difficulty: asTitleCase(quest.difficulty),
    xp: quest.xp,
  }));
}

export function fallbackReferenceQuests(environment: ReferenceEnvironment) {
  const color = environment.colors[0] ?? 'colourful';
  return [
    { id: 'q1', type: 'observation' as const, title: 'Find something that helps people communicate without speaking.', hint: "You'll know it when you see it.", difficulty: 'Easy', xp: 100 },
    { id: 'q2', type: 'reasoning' as const, title: `I remember seeing something ${color}. Find it.`, hint: 'Trust your memory of the room.', difficulty: 'Medium', xp: 150 },
    { id: 'q3', type: 'visual' as const, title: 'Find something that becomes much less useful without electricity.', hint: 'It probably has a plug or a battery.', difficulty: 'Easy', xp: 75 },
  ];
}

export function validateReferenceQuest(missionTitle: string, attempt: number, difficulty?: string) {
  const seed = boundedHash(missionTitle, attempt);
  const success = attempt > 1 || (seed / 0x1_0000_0000) > 0.2;
  if (!success) {
    return {
      success: false,
      xp: 0,
      reasoning: pick(failureLines, missionTitle, attempt),
      scavvy_line: "I don't think that's quite it.",
    };
  }
  const line = pick(successLines, missionTitle, attempt);
  return {
    success: true,
    xp: difficulty?.toLowerCase() === 'medium' ? 120 : 100,
    reasoning: line,
    scavvy_line: line,
  };
}

export function referenceHint(environment: Partial<ReferenceEnvironment> | undefined, level: number) {
  const hintsFromEnvironment = environment?.possibleHints?.filter((hint): hint is string => typeof hint === 'string' && hint.length > 0)
    ?? ['It\'s closer than you think.', 'Look where people spend the most time.', 'It\'s a very ordinary object.'];
  const safeLevel = Math.max(1, Math.min(3, level));
  const prefixes = { 1: 'I remember seeing ', 2: 'Think about it — ', 3: 'Okay, basically: ' } as const;
  return `${prefixes[safeLevel as 1 | 2 | 3]}${hintsFromEnvironment[(safeLevel - 1) % hintsFromEnvironment.length]!}`;
}
