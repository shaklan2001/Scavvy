// Static content: personalities, adventure styles, and offline fallbacks
// used when the backend/AI service is unreachable (demo must never stall).

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
