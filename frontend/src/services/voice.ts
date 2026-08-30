// Scavvy voice service.
// Runtime: tries the backend /api/voice endpoint (which uses ElevenLabs when a
// key is configured server-side). If that's unavailable it plays a bundled,
// pre-generated spoken clip so the button is ALWAYS audible for the demo.
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { API_URL, isLiveApi } from "@/src/config";

const CLIPS = {
  mission_intro: require("../../assets/audio/mission_intro.mp3"),
  success: require("../../assets/audio/success.mp3"),
  failure: require("../../assets/audio/failure.mp3"),
  adventure_complete: require("../../assets/audio/adventure_complete.mp3"),
} as const;

export type VoiceLine = keyof typeof CLIPS;

const CAPTIONS: Record<VoiceLine, string> = {
  mission_intro: "Alright explorer. Your next mission starts now.",
  success: "Ha! Knew you had it in you.",
  failure: "Hmm... nice try. Let's investigate.",
  adventure_complete: "You did it! What a run.",
};

let current: AudioPlayer | null = null;
let modeReady = false;

async function ensureMode() {
  if (modeReady) return;
  modeReady = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {}
}

async function fetchEleven(line: VoiceLine): Promise<string | null> {
  if (!isLiveApi) return null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}/voice?line=${encodeURIComponent(line)}`, {
      signal: controller.signal,
    });
    clearTimeout(t);
    if (res.status !== 200) return null;
    const j = await res.json();
    return j?.audio || null;
  } catch {
    return null;
  }
}

export const voice = {
  caption(line: VoiceLine) {
    return CAPTIONS[line];
  },

  stop() {
    if (current) {
      try {
        current.pause();
        current.remove();
      } catch {}
      current = null;
    }
  },

  // Plays a line. Resolves after playback finishes (or immediately on error).
  async play(line: VoiceLine, onDone?: () => void) {
    await ensureMode();
    this.stop(); // never overlap; replace any in-flight playback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const remote = await fetchEleven(line);
    let player: AudioPlayer;
    try {
      player = createAudioPlayer(remote ? { uri: remote } : CLIPS[line]);
    } catch {
      onDone?.();
      return;
    }
    current = player;

    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      onDone?.();
      try {
        player.remove();
      } catch {}
      if (current === player) current = null;
    };

    try {
      player.addListener("playbackStatusUpdate", (s: any) => {
        if (s?.didJustFinish) done();
      });
      player.play();
    } catch {
      done();
    }

    // Safety net so button state always restores even if the finish event
    // never fires (e.g. web autoplay restrictions).
    setTimeout(done, 6000);
  },
};
