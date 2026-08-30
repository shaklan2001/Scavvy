import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, MascotBlob } from "@/src/components/ScavvyMascot";
import { Button, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";
import { ai } from "@/src/services/ai";

export default function Failure() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { adventure, profile, swapMission } = useScavvy();
  const { index = "0", attempt = "1", reason = "" } = useLocalSearchParams<{ index: string; attempt: string; reason: string }>();
  const [busy, setBusy] = useState(false);

  const idx = parseInt(index, 10) || 0;
  const nextAttempt = (parseInt(attempt, 10) || 1) + 1;

  const tryAgain = () => {
    router.replace({ pathname: "/mission/camera", params: { index: String(idx), attempt: String(nextAttempt) } });
  };

  const makeEasier = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const mission = adventure?.missions[idx];
      const easier = await ai.easierMission(mission?.title || "", profile?.style || "RANDOM");
      swapMission(idx, easier);
      router.replace({ pathname: "/mission/camera", params: { index: String(idx), attempt: "1" } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <CreamBg>
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.hero}>
          <MascotBlob size={240} color="#FFE0C6" />
          <ScavvyMascot pose="confused" size="xl" anim="wiggle" testID="failure-mascot" />
        </View>

        <View style={styles.body}>
          <T weight="extrabold" size={32} color={colors.charcoal}>
            Hmm... nice try.
          </T>
          <T weight="medium" size={16} color={colors.brown} style={{ marginTop: spacing.md }}>
            I don't think that's what I was looking for.
          </T>

          <View style={styles.quote}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.orange} />
            <T weight="semibold" size={14} color={colors.charcoalSoft} style={{ marginLeft: 8, flex: 1, fontStyle: "italic" }}>
              {String(reason) || "Technically... everything makes you wait if you're patient enough."}
            </T>
          </View>
          <T weight="semibold" size={13} color={colors.brownSoft} style={{ marginTop: spacing.md }}>
            You didn't fail. Let's investigate. 🔍
          </T>
        </View>

        <Button testID="try-again-button" label="TRY AGAIN" icon="refresh" onPress={tryAgain} />
        <View style={{ height: spacing.md }} />
        <Button
          testID="make-easier-button"
          label={busy ? "SCAVVY IS THINKING..." : "MAKE IT EASIER"}
          variant="secondary"
          icon="happy"
          onPress={makeEasier}
          disabled={busy}
        />
      </View>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 240 },
  body: { marginBottom: spacing.xl },
  quote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.softCream,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginTop: spacing.lg,
  },
});
