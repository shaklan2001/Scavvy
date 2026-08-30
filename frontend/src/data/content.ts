// Static content: personalities, adventure styles, and offline fallbacks.
// The Expo app runs standalone — these mocks are the default AI path.
import type { EnvironmentContext, Quest } from "@/src/types";

export type Personality = {
  key: string;
  title: string;
  tagline: string;
  icon: string; // Ionicons name
};

export type Style = {
  key: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
};

export const PERSONALITIES: Personality[] = [
  { key: "detective", title: "THE DETECTIVE", tagline: "I notice everything.", icon: "search" },
  { key: "explorer", title: "THE EXPLORER", tagline: "Take me somewhere new.", icon: "compass" },
  { key: "creative", title: "THE CREATIVE", tagline: "Make it interesting.", icon: "color-palette" },
  { key: "chaos", title: "THE CHAOS AGENT", tagline: "Rules are suggestions.", icon: "flash" },
];

export const STYLES: Style[] = [
  { key: "MYSTERY", title: "MYSTERY", desc: "Clues, secrets & strange discoveries", icon: "search-circle", color: "#FF8A00" },
  { key: "DISCOVERY", title: "DISCOVERY", desc: "Notice the world differently", icon: "leaf", color: "#55A63A" },
  { key: "CHAOS", title: "CHAOS", desc: "Ridiculous challenges", icon: "flash", color: "#E65A32" },
  { key: "RANDOM", title: "RANDOM", desc: "Surprise me", icon: "dice", color: "#FFC107" },
];

const POOLS: Record<string, string[]> = {
  MYSTERY: [
    "Find something that looks completely ordinary but has a secret purpose.",
    "Find something that's hiding in plain sight.",
    "Find something older than it looks.",
  ],
  DISCOVERY: [
    "Find something nearby that makes someone's life easier.",
    "Find something you walk past every day but never really see.",
    "Find something that has been waiting longer than you have.",
  ],
  CHAOS: [
    "Find something blue that doesn't belong here.",
    "Find the most dramatic object within reach.",
    "Find something pretending to be something else.",
  ],
};

const HINTS = ["Don't overthink it.", "Trust your gut.", "First thing you see counts."];

export function fallbackMissions(style: string) {
  const s = (style || "RANDOM").toUpperCase();
  let pool: string[];
  if (s === "RANDOM" || !POOLS[s]) {
    pool = Object.values(POOLS).flat();
  } else {
    pool = [...POOLS[s]];
  }
  pool = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  const diffs = ["Easy", "Easy", "Medium"];
  return pool.map((title, i) => ({
    index: i,
    title,
    hint: HINTS[i % HINTS.length],
    difficulty: diffs[i] || "Medium",
  }));
}

const FALLBACK_SUCCESS = [
  "Yep. That absolutely counts. Suspiciously good taste.",
  "A fine specimen. Scavvy approves.",
  "Case closed. You noticed what most people miss.",
];

export function fallbackAnalyze(missionTitle: string, difficulty = "Easy") {
  const t = missionTitle.toLowerCase();
  let line = FALLBACK_SUCCESS[Math.floor(Math.random() * FALLBACK_SUCCESS.length)];
  if (t.includes("easier")) line = "Yep — that definitely makes someone's life easier.";
  else if (t.includes("blue")) line = "That's about as blue as it gets. I like it.";
  return {
    success: true,
    xp: difficulty.toLowerCase() === "medium" ? 120 : 100,
    detected: "One suspicious object detected",
    reasoning: line,
    scavvy_line: line,
  };
}

export const FALLBACK_TRAITS: Record<string, Record<string, number>> = {
  detective: { explorer: 78, observation: 95, curiosity: 90, chaos: 45 },
  explorer: { explorer: 96, observation: 80, curiosity: 88, chaos: 55 },
  creative: { explorer: 82, observation: 84, curiosity: 93, chaos: 70 },
  chaos: { explorer: 80, observation: 72, curiosity: 86, chaos: 95 },
};

export const FALLBACK_SUMMARY: Record<string, string> = {
  detective: "You're surprisingly good at noticing ordinary things.",
  explorer: "You treat every corner like it owes you a discovery.",
  creative: "You find stories in objects most people ignore.",
  chaos: "You picked the weirdest possible answers. I'm impressed and concerned.",
};

const ENV_BY_LOCATION: Record<string, EnvironmentContext> = {
  Home: {
    environmentType: "a cosy home",
    visibleObjects: ["mug", "lamp", "remote control", "houseplant", "book", "charger"],
    colors: ["warm brown", "cream", "green"],
    landmarks: ["sofa", "window"],
    possibleQuestTargets: ["remote control", "houseplant", "mug"],
    possibleHints: ["near where people relax", "something that needs water", "it holds a warm drink"],
  },
  Office: {
    environmentType: "a busy office",
    visibleObjects: ["laptop", "whiteboard", "coffee cup", "monitor", "sticky notes", "backpack"],
    colors: ["grey", "blue", "white"],
    landmarks: ["desk", "meeting board"],
    possibleQuestTargets: ["whiteboard", "laptop", "coffee cup"],
    possibleHints: ["people look at it in meetings", "useless without electricity", "it keeps you awake"],
  },
  Campus: {
    environmentType: "a university campus",
    visibleObjects: ["backpack", "notebook", "water bottle", "projector", "bench", "poster"],
    colors: ["blue", "green", "white"],
    landmarks: ["lecture board", "noticeboard"],
    possibleQuestTargets: ["projector", "water bottle", "poster"],
    possibleHints: ["helps a big group see", "keeps you hydrated", "it hangs on a wall"],
  },
  Outdoors: {
    environmentType: "an outdoor space",
    visibleObjects: ["tree", "bench", "sign", "bicycle", "trash bin", "streetlight"],
    colors: ["green", "grey", "brown"],
    landmarks: ["path", "signpost"],
    possibleQuestTargets: ["sign", "bench", "streetlight"],
    possibleHints: ["tells you where to go", "lights up at night", "a place to sit"],
  },
  "Somewhere Else": {
    environmentType: "an interesting space",
    visibleObjects: ["chair", "bottle", "bag", "phone", "clock", "cup"],
    colors: ["mixed"],
    landmarks: ["corner", "table"],
    possibleQuestTargets: ["clock", "bottle", "bag"],
    possibleHints: ["it keeps track of time", "you carry things in it", "you drink from it"],
  },
};

export function fallbackEnvironment(locationType: string): EnvironmentContext {
  return ENV_BY_LOCATION[locationType] ?? ENV_BY_LOCATION.Home;
}

export function fallbackQuests(environment: EnvironmentContext): Quest[] {
  const color = environment.colors[0] ?? "colourful";
  return [
    {
      id: "q1",
      type: "observation",
      title: "Find something that helps people communicate without speaking.",
      hint: "You'll know it when you see it.",
      difficulty: "Easy",
      xp: 100,
    },
    {
      id: "q2",
      type: "reasoning",
      title: `I remember seeing something ${color}. Find it.`,
      hint: "Trust your memory of the room.",
      difficulty: "Medium",
      xp: 150,
    },
    {
      id: "q3",
      type: "visual",
      title: "Find something that becomes much less useful without electricity.",
      hint: "It probably has a plug or a battery.",
      difficulty: "Easy",
      xp: 75,
    },
  ];
}

export function fallbackHint(environment: EnvironmentContext | null, hintLevel: number): string {
  const hints = environment?.possibleHints ?? [
    "I remember seeing something useful nearby.",
    "People usually spend the most time near it.",
    "It's a very ordinary object, honestly.",
  ];
  const level = Math.min(Math.max(hintLevel, 1), 3);
  return hints[level - 1] ?? hints[0];
}
