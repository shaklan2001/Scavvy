import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/src/utils/storage";
import { ai } from "@/src/services/ai";
import type { Adventure, EnvironmentContext, Mission, Quest } from "@/src/types";

export type Profile = {
  name: string;
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

const PROFILE_KEY = "scavvy:profile:v1";
const PROGRESS_KEY = "scavvy:progress:v1";

// Seeded starting stats so the very first home screen feels alive (matches
// the product mock: 4 day streak / 27 missions / Explorer Level 3).
const SEED_PROGRESS: Progress = { streak: 4, totalMissions: 27, xp: 2820, adventures: 5 };

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
  env: EnvironmentContext | null;
  scanImages: string[];
  setEnv: (e: EnvironmentContext | null) => void;
  setScanImages: (imgs: string[]) => void;
  loadQuests: (missions: Array<Quest | Mission>) => void;
  selectQuest: (index: number) => void;
  saveProfile: (p: Partial<Profile>) => Promise<void>;
  startAdventure: () => Promise<ActiveAdventure>;
  completeMission: (index: number, xp: number, line: string, photoUri: string | null) => Promise<void>;
  swapMission: (index: number, mission: Mission) => void;
  resetAdventure: () => void;
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
  const [env, setEnv] = useState<EnvironmentContext | null>(null);
  const [scanImages, setScanImages] = useState<string[]>([]);

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
    (async () => {
      const p = await storage.getItem<Profile | null>(PROFILE_KEY, null);
      const pr = await storage.getItem<Progress | null>(PROGRESS_KEY, null);
      if (p) setProfile(p);
      if (pr) setProgress(pr);
      setReady(true);
    })();
  }, []);

  const saveProfile = useCallback(async (patch: Partial<Profile>) => {
    setProfile((prev) => {
      const base: Profile = prev || {
        name: "Explorer",
        personality: "explorer",
        style: "RANDOM",
        cameraAsked: false,
        locationAsked: false,
      };
      const next = { ...base, ...patch };
      storage.setItem(PROFILE_KEY, next);
      return next;
    });
    // First time a profile is created, lay down seed progress.
    const existing = await storage.getItem<Progress | null>(PROGRESS_KEY, null);
    if (!existing) {
      setProgress(SEED_PROGRESS);
      await storage.setItem(PROGRESS_KEY, SEED_PROGRESS);
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
      setProgress((prev) => {
        const next = { ...prev, totalMissions: prev.totalMissions + 1, xp: prev.xp + xp };
        storage.setItem(PROGRESS_KEY, next);
        return next;
      });
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

  const resetAdventure = useCallback(() => setAdventure(null), []);

  const addStreak = useCallback(async () => {
    setProgress((prev) => {
      const next = { ...prev, streak: prev.streak + 1 };
      storage.setItem(PROGRESS_KEY, next);
      return next;
    });
  }, []);

  const resetDemo = useCallback(async () => {
    setProgress(SEED_PROGRESS);
    await storage.setItem(PROGRESS_KEY, SEED_PROGRESS);
    setAdventure(null);
  }, []);

  const logout = useCallback(async () => {
    await storage.removeItem(PROFILE_KEY);
    await storage.removeItem(PROGRESS_KEY);
    setProfile(null);
    setProgress(SEED_PROGRESS);
    setAdventure(null);
  }, []);

  return (
    <ScavvyCtx.Provider
      value={{
        ready,
        profile,
        progress,
        adventure,
        env,
        scanImages,
        setEnv,
        setScanImages,
        loadQuests,
        selectQuest,
        saveProfile,
        startAdventure,
        completeMission,
        swapMission,
        resetAdventure,
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
