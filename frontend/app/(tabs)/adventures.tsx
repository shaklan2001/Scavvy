import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot } from "@/src/components/ScavvyMascot";
import { Card, SpeechBubble, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { TAB_BAR_HEIGHT } from "@/src/components/GlassTabBar";
import { STYLES } from "@/src/data/content";
import { useScavvy } from "@/src/state/ScavvyContext";

export default function Adventures() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveProfile, startAdventure } = useScavvy();
  const [busy, setBusy] = useState<string | null>(null);

  const launch = async (styleKey: string) => {
    if (busy) return;
    setBusy(styleKey);
    try {
      await saveProfile({ style: styleKey });
      await startAdventure();
      router.push("/mission/reveal");
    } finally {
      setBusy(null);
    }
  };

  return (
    <CreamBg decorate={false}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <T weight="extrabold" size={26} color={colors.charcoal}>
          Pick your trouble
        </T>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mascotRow}>
          <ScavvyMascot pose="exploring" size={120} anim="wiggle" />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <SpeechBubble text="Tap one and I'll cook up 3 fresh missions." />
          </View>
        </View>

        {STYLES.map((s) => (
          <Card
            key={s.key}
            testID={`adventure-style-${s.key}`}
            onPress={() => launch(s.key)}
            style={styles.row}
          >
            <View style={[styles.iconBox, { backgroundColor: s.color }]}>
              <Ionicons name={s.icon as any} size={26} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.base }}>
              <T weight="extrabold" size={17} color={colors.charcoal}>
                {s.title}
              </T>
              <T weight="medium" size={13} color={colors.brown} style={{ marginTop: 2 }}>
                {s.desc}
              </T>
            </View>
            <Ionicons
              name={busy === s.key ? "hourglass" : "arrow-forward-circle"}
              size={28}
              color={colors.orange}
            />
          </Card>
        ))}
      </ScrollView>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  mascotRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.base, marginBottom: spacing.md },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
