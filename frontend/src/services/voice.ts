// Scavvy voice — mock ElevenLabs interface. Real narration wires in later
// (server-side). For now it triggers haptics + a short "speaking" window so
// the UI can show Scavvy reacting.
import * as Haptics from "expo-haptics";

export type VoiceLine =
  | "missionIntro"
  | "successReaction"
  | "failureReaction"
  | "adventureComplete";

const CAPTIONS: Record<VoiceLine, string> = {
  missionIntro: "Alright detective... let's see what you've got.",
  successReaction: "Ha! Knew you had it in you.",
  failureReaction: "Eh, happens to the best of us. Again!",
  adventureComplete: "What a run. My tiny raccoon heart is full.",
};

export const voice = {
  caption(line: VoiceLine) {
    return CAPTIONS[line];
  },
  // Returns the (mock) duration Scavvy "speaks" for, so the UI can animate.
  async play(line: VoiceLine): Promise<number> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    return 1600;
  },
};
