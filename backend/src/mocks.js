const crypto = require("crypto");

const MISSION_POOLS = {
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

const SUCCESS_LINES = [
  "Yep. That absolutely counts. Suspiciously good taste.",
  "A fine specimen. Scavvy approves.",
  "Case closed. You noticed what most people miss.",
];

const FAIL_LINES = [
  "Bold interpretation. I respect it, but no.",
  "Close! In a parallel universe, that totally works.",
];

const ENV_BY_LOCATION = {
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

const TRAITS = {
  detective: { explorer: 78, observation: 95, curiosity: 90, chaos: 45 },
  explorer: { explorer: 96, observation: 80, curiosity: 88, chaos: 55 },
  creative: { explorer: 82, observation: 84, curiosity: 93, chaos: 70 },
  chaos: { explorer: 80, observation: 72, curiosity: 86, chaos: 95 },
};

const SUMMARIES = {
  detective: "You're surprisingly good at noticing ordinary things.",
  explorer: "You treat every corner like it owes you a discovery.",
  creative: "You find stories in objects most people ignore.",
  chaos: "You picked the weirdest possible answers. I'm impressed and concerned.",
};

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function environmentFor(locationType) {
  return ENV_BY_LOCATION[locationType] ?? ENV_BY_LOCATION.Home;
}

function buildMissions(style) {
  const key = (style || "RANDOM").toUpperCase();
  const pool =
    key === "RANDOM" || !MISSION_POOLS[key]
      ? Object.values(MISSION_POOLS).flat()
      : [...MISSION_POOLS[key]];
  const diffs = ["Easy", "Easy", "Medium"];
  return shuffle(pool)
    .slice(0, 3)
    .map((title, index) => ({
      index,
      title,
      hint: HINTS[index % HINTS.length],
      difficulty: diffs[index] ?? "Medium",
    }));
}

function buildQuests(environment) {
  const color = environment?.colors?.[0] ?? "colourful";
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

function analyzeMission({ missionTitle, difficulty, attempt }) {
  const title = (missionTitle || "").toLowerCase();
  let success = attempt > 1 || Math.random() > 0.2;
  if (title.includes("easier") || title.includes("orange")) success = true;

  if (success) {
    let line = pick(SUCCESS_LINES);
    if (title.includes("easier")) line = "Yep — that definitely makes someone's life easier.";
    if (title.includes("blue")) line = "That's about as blue as it gets. I like it.";
    return {
      success: true,
      xp: (difficulty || "Easy").toLowerCase() === "medium" ? 120 : 100,
      detected: "One suspicious object detected",
      reasoning: line,
      scavvy_line: line,
    };
  }

  return {
    success: false,
    xp: 0,
    detected: "Something interesting spotted",
    reasoning: pick(FAIL_LINES),
    scavvy_line: "I don't think that's quite what I was looking for.",
  };
}

function easierMission() {
  return {
    index: 0,
    title: "Find literally anything orange. That's it. That's the mission.",
    hint: "Okay okay, I made it easy. Go.",
    difficulty: "Easy",
  };
}

function hintFor(environment, hintLevel) {
  const hints = environment?.possibleHints ?? [
    "I remember seeing something useful nearby.",
    "People usually spend the most time near it.",
    "It's a very ordinary object, honestly.",
  ];
  const level = Math.min(Math.max(hintLevel, 1), 3);
  return hints[level - 1] ?? hints[0];
}

function summaryFor({ name, personality, totalXp }) {
  const key = (personality || "explorer").toLowerCase();
  return {
    headline: "ADVENTURE COMPLETE",
    summary: SUMMARIES[key] ?? SUMMARIES.explorer,
    traits: TRAITS[key] ?? TRAITS.explorer,
    total_xp: totalXp,
    streak_delta: 1,
    name: name || "Explorer",
  };
}

function newId() {
  return crypto.randomUUID();
}

module.exports = {
  environmentFor,
  buildMissions,
  buildQuests,
  analyzeMission,
  easierMission,
  hintFor,
  summaryFor,
  newId,
};
