import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import dayjs from "dayjs";
import { storage } from "@/src/utils/storage";
import { ai } from "@/src/services/ai";
import type { Adventure, EnvironmentContext, Mission, Quest, VerificationPhoto } from "@/src/types";

export type Profile = {
  name: string;
  email: string;
  personality: string;
  style: string;
  cameraAsked: boolean;
  locationAsked: boolean;
};

export type Progress = {
  streak: number;
  totalMissions: number;
  xp: number;
  adventures: number;
};

export type ActiveMission = Mission & {
  status: "pending" | "done";
  photoUri: string | null;
  earnedXp: number;
  line: string;
};

export type ActiveAdventure = {
  id: string;
  missions: ActiveMission[];
  currentIndex: number;
};

export type SavedAdventure = {
  id: string;
  title: string;
  when: string;
  summary: string;
  missionsCount: number;
  xp: number;
  minutes: number;
  missions: Array<{ n: number; prompt: string; reaction: string; xp: number }>;
};

const PROFILE_KEY = "scavvy:profile:v1";
const PROGRESS_KEY = "scavvy:progress:v1";
const ADVENTURE_KEY = "scavvy:adventure:v1";
const ENV_KEY = "scavvy:env:v1";
const HISTORY_KEY = "scavvy:history:v1";

// Seeded starting stats so the very first home screen feels alive (matches
// the product mock: 4 day streak / 27 missions / Explorer Level 3).
const SEED_PROGRESS: Progress = { streak: 4, totalMissions: 27, xp: 2820, adventures: 5 };

function compactAdventure(adventure: ActiveAdventure): ActiveAdventure {
  return {
    ...adventure,
    missions: adventure.missions.map((mission) => ({
      ...mission,
      photoUri: mission.photoUri && mission.photoUri.startsWith("data:") ? null : mission.photoUri,
    })),
  };
}

function toSavedAdventure(adventure: ActiveAdventure, env: EnvironmentContext | null): SavedAdventure {
  const done = adventure.missions.filter((mission) => mission.status === "done");
  const xp = done.reduce((sum, mission) => sum + (mission.earnedXp || 0), 0);
  const place = env?.environmentType?.trim();
  return {
    id: adventure.id,
    title: place ? `${place} Adventure` : "Adventure",
    when: dayjs().format("TODAY · H:mm").toUpperCase(),
    summary: done[0]?.line || done[0]?.title || "You finished a Scavvy run.",
    missionsCount: done.length || adventure.missions.length,
    xp,
    minutes: Math.max(5, done.length * 4),
    missions: adventure.missions.map((mission, index) => ({
      n: index + 1,
      prompt: mission.title,
      reaction: mission.line || mission.hint || "",
      xp: mission.earnedXp || mission.xp || 0,
    })),
  };
}

export function levelFromMissions(total: number) {
  return Math.floor(total / 10) + 1;
}
export function levelTitle(personality: string) {
  const map: Record<string, string> = {
    detective: "Detective",
    explorer: "Explorer",
    creative: "Creative",
    chaos: "Chaos",
  };
  return map[personality] || "Explorer";
}

type Ctx = {
  ready: boolean;
  profile: Profile | null;
  progress: Progress;
  adventure: ActiveAdventure | null;
  adventureHistory: SavedAdventure[];
  env: EnvironmentContext | null;
  scanImages: string[];
  verificationPhoto: VerificationPhoto | null;
  setEnv: (e: EnvironmentContext | null) => void;
  setScanImages: (imgs: string[]) => void;
  setVerificationPhoto: (photo: VerificationPhoto | null) => void;
  loadQuests: (missions: Array<Quest | Mission>) => void;
  selectQuest: (index: number) => void;
  saveProfile: (p: Partial<Profile>) => Promise<void>;
  startAdventure: () => Promise<ActiveAdventure>;
  completeMission: (index: number, xp: number, line: string, photoUri: string | null) => Promise<void>;
  swapMission: (index: number, mission: Mission) => void;
  resetAdventure: () => void;
  finishAdventure: () => Promise<void>;
  addStreak: () => Promise<void>;
  resetDemo: () => Promise<void>;
  logout: () => Promise<void>;
};

const ScavvyCtx = createContext<Ctx | null>(null);

export function ScavvyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Progress>(SEED_PROGRESS);
  const [adventure, setAdventure] = useState<ActiveAdventure | null>(null);
  const [adventureHistory, setAdventureHistory] = useState<SavedAdventure[]>([]);
  const [env, setEnv] = useState<EnvironmentContext | null>(null);
  const [scanImages, setScanImages] = useState<string[]>([]);
  const [verificationPhoto, setVerificationPhoto] = useState<VerificationPhoto | null>(null);
  const persistReady = useRef(false);

  const loadQuests = useCallback((missions: Array<Quest | Mission>) => {
    setAdventure({
      id: `adv-${Date.now()}`,
      currentIndex: 0,
      missions: missions.map((mission, index) => ({
        index,
        title: mission.title,
        hint: mission.hint,
        difficulty: mission.difficulty || "Easy",
        type: "type" in mission ? mission.type : undefined,
        xp: "xp" in mission ? mission.xp ?? 100 : 100,
        status: "pending" as const,
        photoUri: null,
        earnedXp: 0,
        line: "",
      })),
    });
  }, []);

  const selectQuest = useCallback((index: number) => {
    setAdventure((prev) => (prev ? { ...prev, currentIndex: index } : prev));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedProfile, storedProgress, storedAdventure, storedEnv, storedHistory] = await Promise.all([
        storage.getItem(PROFILE_KEY, null),
        storage.getItem(PROGRESS_KEY, null),
        storage.getItem(ADVENTURE_KEY, null),
        storage.getItem(ENV_KEY, null),
        storage.getItem(HISTORY_KEY, null),
      ]);
      if (cancelled) return;
      if (storedProfile && typeof storedProfile === "object") {
        const record = storedProfile as Partial<Profile>;
        setProfile({
          name: record.name || "Explorer",
          email: record.email || "",
          personality: record.personality || "explorer",
          style: record.style || "RANDOM",
          cameraAsked: Boolean(record.cameraAsked),
          locationAsked: Boolean(record.locationAsked),
        });
      }
      if (storedProgress && typeof storedProgress === "object") {
        setProgress(storedProgress as Progress);
      }
      if (storedAdventure && typeof storedAdventure === "object") {
        setAdventure(storedAdventure as ActiveAdventure);
      }
      if (storedEnv && typeof storedEnv === "object") {
        setEnv(storedEnv as EnvironmentContext);
      }
      if (Array.isArray(storedHistory)) {
        setAdventureHistory(storedHistory as SavedAdventure[]);
      }
      persistReady.current = true;
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!persistReady.current) return;
    if (profile) void storage.setItem(PROFILE_KEY, profile);
    else void storage.removeItem(PROFILE_KEY);
  }, [profile]);

  useEffect(() => {
    if (!persistReady.current) return;
    void storage.setItem(PROGRESS_KEY, progress);
  }, [progress]);

  useEffect(() => {
    if (!persistReady.current) return;
    if (adventure) void storage.setItem(ADVENTURE_KEY, compactAdventure(adventure));
    else void storage.removeItem(ADVENTURE_KEY);
  }, [adventure]);

  useEffect(() => {
    if (!persistReady.current) return;
    if (env) void storage.setItem(ENV_KEY, env);
    else void storage.removeItem(ENV_KEY);
  }, [env]);

  useEffect(() => {
    if (!persistReady.current) return;
    void storage.setItem(HISTORY_KEY, adventureHistory);
  }, [adventureHistory]);

  const saveProfile = useCallback(async (patch: Partial<Profile>) => {
    setProfile((prev) => {
      const base: Profile = prev || {
        name: "Explorer",
        email: "",
        personality: "explorer",
        style: "RANDOM",
        cameraAsked: false,
        locationAsked: false,
      };
      return { ...base, ...patch };
    });
    const existing = await storage.getItem(PROGRESS_KEY, null);
    if (!existing) {
      setProgress(SEED_PROGRESS);
    }
  }, []);

  const startAdventure = useCallback(async () => {
    const name = profile?.name || "Explorer";
    const personality = profile?.personality || "explorer";
    const style = profile?.style || "RANDOM";
    const adv: Adventure = await ai.startAdventure(name, personality, style);
    const active: ActiveAdventure = {
      id: adv.id,
      currentIndex: 0,
      missions: adv.missions.map((m) => ({
        ...m,
        status: "pending",
        photoUri: null,
        earnedXp: 0,
        line: "",
      })),
    };
    setAdventure(active);
    return active;
  }, [profile]);

  const completeMission = useCallback(
    async (index: number, xp: number, line: string, photoUri: string | null) => {
      setAdventure((prev) => {
        if (!prev) return prev;
        const missions = prev.missions.map((m, i) =>
          i === index ? { ...m, status: "done" as const, earnedXp: xp, line, photoUri } : m
        );
        const nextIndex = Math.min(index + 1, missions.length - 1);
        return { ...prev, missions, currentIndex: nextIndex };
      });
      setProgress((prev) => ({
        ...prev,
        totalMissions: prev.totalMissions + 1,
        xp: prev.xp + xp,
      }));
    },
    []
  );

  const swapMission = useCallback((index: number, mission: Mission) => {
    setAdventure((prev) => {
      if (!prev) return prev;
      const missions = prev.missions.map((m, i) =>
        i === index ? { ...m, ...mission, index, status: "pending" as const, photoUri: null } : m
      );
      return { ...prev, missions };
    });
  }, []);

  const resetAdventure = useCallback(() => {
    setAdventure(null);
    setEnv(null);
    setScanImages([]);
    setVerificationPhoto(null);
  }, []);

  const finishAdventure = useCallback(async () => {
    if (adventure) {
      const entry = toSavedAdventure(adventure, env);
      setAdventureHistory((prev) => [entry, ...prev.filter((item) => item.id !== entry.id)].slice(0, 50));
      setProgress((prev) => ({ ...prev, adventures: prev.adventures + 1 }));
    }
    setAdventure(null);
    setEnv(null);
    setScanImages([]);
    setVerificationPhoto(null);
  }, [adventure, env]);

  const addStreak = useCallback(async () => {
    setProgress((prev) => ({ ...prev, streak: prev.streak + 1 }));
  }, []);

  const resetDemo = useCallback(async () => {
    setProgress(SEED_PROGRESS);
    setAdventure(null);
    setAdventureHistory([]);
    setEnv(null);
    setScanImages([]);
    setVerificationPhoto(null);
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      storage.removeItem(PROFILE_KEY),
      storage.removeItem(PROGRESS_KEY),
      storage.removeItem(ADVENTURE_KEY),
      storage.removeItem(ENV_KEY),
      storage.removeItem(HISTORY_KEY),
    ]);
    setProfile(null);
    setProgress(SEED_PROGRESS);
    setAdventure(null);
    setAdventureHistory([]);
    setEnv(null);
    setScanImages([]);
    setVerificationPhoto(null);
  }, []);

  return (
    <ScavvyCtx.Provider
      value={{
        ready,
        profile,
        progress,
        adventure,
        adventureHistory,
        env,
        scanImages,
        verificationPhoto,
        setEnv,
        setScanImages,
        setVerificationPhoto,
        loadQuests,
        selectQuest,
        saveProfile,
        startAdventure,
        completeMission,
        swapMission,
        resetAdventure,
        finishAdventure,
        addStreak,
        resetDemo,
        logout,
      }}
    >
      {children}
    </ScavvyCtx.Provider>
  );
}

export function useScavvy() {
  const ctx = useContext(ScavvyCtx);
  if (!ctx) throw new Error("useScavvy must be used within ScavvyProvider");
  return ctx;
}
