// Local demo data driving Home / Adventures / Profile so the UI is data-driven
// and easy to wire to a real backend later.
import { Ionicons } from "@expo/vector-icons";
import type { ScavvyPose } from "@/src/components/ScavvyMascot";

export const LEVEL_SIZE = 600; // XP per level band

export function levelInfo(xp: number, missionsLevel: number) {
  // Level is driven by missions (stable), XP band shown as progress.
  const level = missionsLevel;
  const inLevel = xp % LEVEL_SIZE;
  return { level, inLevel, needed: LEVEL_SIZE };
}

export type DemoMission = {
  n: number;
  prompt: string;
  reaction: string;
  xp: number;
};

export type DemoAdventure = {
  id: string;
  title: string;
  when: string; // e.g. "TODAY · 2:44"
  summary: string;
  missionsCount: number;
  xp: number;
  minutes: number;
  mascot: ScavvyPose;
  missions: DemoMission[];
};

export const DEMO_ADVENTURES: DemoAdventure[] = [
  {
    id: "saturday-night",
    title: "Saturday Night",
    when: "TODAY · 2:44",
    summary: "You're surprisingly good at noticing ordinary things.",
    missionsCount: 3,
    xp: 280,
    minutes: 18,
    mascot: "detective",
    missions: [
      { n: 1, prompt: "Find something that makes someone's life easier.", reaction: "Yep — that definitely makes life easier.", xp: 100 },
      { n: 2, prompt: "Find something hiding in plain sight.", reaction: "Sneaky. I walked past that twice.", xp: 100 },
      { n: 3, prompt: "Find something older than it looks.", reaction: "Ooh, a veteran object. Respect.", xp: 80 },
    ],
  },
  {
    id: "city-explorer",
    title: "City Explorer",
    when: "2 DAYS AGO · 23:10",
    summary: "You walked further than the mission asked. Twice.",
    missionsCount: 5,
    xp: 460,
    minutes: 31,
    mascot: "exploring",
    missions: [
      { n: 1, prompt: "Find something that quietly does an important job.", reaction: "The unsung hero. Nice eye.", xp: 100 },
      { n: 2, prompt: "Find the most ignored object around you.", reaction: "Poor thing. Finally noticed.", xp: 90 },
      { n: 3, prompt: "Find something designed by a person who cared.", reaction: "You can feel the love, huh?", xp: 90 },
      { n: 4, prompt: "Find something blue that doesn't belong.", reaction: "As blue as it gets.", xp: 90 },
      { n: 5, prompt: "Find something that has been waiting.", reaction: "Patient little thing.", xp: 90 },
    ],
  },
  {
    id: "kitchen-investigation",
    title: "Kitchen Investigation",
    when: "4 DAYS AGO · 14:35",
    summary: "Every clue was within two metres of the kettle. Efficient.",
    missionsCount: 3,
    xp: 250,
    minutes: 11,
    mascot: "thinking",
    missions: [
      { n: 1, prompt: "Find something round. Scavvy loves round things.", reaction: "A perfect circle of joy.", xp: 80 },
      { n: 2, prompt: "Find something that makes a sound.", reaction: "I heard that from here.", xp: 90 },
      { n: 3, prompt: "Find something pretending to be something else.", reaction: "A master of disguise.", xp: 80 },
    ],
  },
  {
    id: "rainy-tuesday",
    title: "Rainy Tuesday",
    when: "LAST WEEK · 19:52",
    summary: "You picked the most useless object in under nine seconds.",
    missionsCount: 4,
    xp: 390,
    minutes: 24,
    mascot: "curious",
    missions: [
      { n: 1, prompt: "Find the most dramatic object within reach.", reaction: "Oscar-worthy performance.", xp: 100 },
      { n: 2, prompt: "Find something soft you could nap on.", reaction: "Don't mind if I do.", xp: 90 },
      { n: 3, prompt: "Find something with a face (real or imaginary).", reaction: "It's judging you. Rude.", xp: 100 },
      { n: 4, prompt: "Find the strangest texture near you.", reaction: "I felt that with my eyes.", xp: 100 },
    ],
  },
  {
    id: "morning-scout",
    title: "Morning Scout",
    when: "LAST WEEK · 08:12",
    summary: "Caffeinated and dangerous. Every find was a good one.",
    missionsCount: 3,
    xp: 190,
    minutes: 9,
    mascot: "excited",
    missions: [
      { n: 1, prompt: "Find literally anything orange.", reaction: "My favourite colour. Obviously.", xp: 60 },
      { n: 2, prompt: "Find something that keeps a secret.", reaction: "I won't tell. Probably.", xp: 70 },
      { n: 3, prompt: "Find something that looks too proud of itself.", reaction: "The audacity. I love it.", xp: 60 },
    ],
  },
];

export const TOTAL_SESSIONS = DEMO_ADVENTURES.length;
export const TOTAL_XP_EARNED = DEMO_ADVENTURES.reduce((s, a) => s + a.xp, 0);

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  unlocked: boolean;
  current: number;
  total: number;
  reward: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "sharp-eyes", title: "Sharp Eyes", desc: "Complete 10 observation missions.", icon: "eye", unlocked: true, current: 10, total: 10, reward: 100 },
  { id: "world-watcher", title: "World Watcher", desc: "Finish adventures in 5 different places.", icon: "earth", unlocked: true, current: 5, total: 5, reward: 150 },
  { id: "night-owl", title: "Night Owl", desc: "Finish an adventure after 10pm.", icon: "moon", unlocked: true, current: 1, total: 1, reward: 80 },
  { id: "agent-of-chaos", title: "Agent of Chaos", desc: "Complete 5 chaos missions without skipping one.", icon: "sync", unlocked: false, current: 3, total: 5, reward: 200 },
  { id: "streak-keeper", title: "Streak Keeper", desc: "Play 7 days in a row.", icon: "flame", unlocked: false, current: 4, total: 7, reward: 150 },
  { id: "deep-diver", title: "Deep Diver", desc: "Complete a hard mission on the first try.", icon: "search", unlocked: false, current: 1, total: 4, reward: 250 },
];

export function achievementById(id: string) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
export function adventureById(id: string) {
  return DEMO_ADVENTURES.find((a) => a.id === id);
}
