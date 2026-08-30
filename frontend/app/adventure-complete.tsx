import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DarkBg } from "@/src/components/Bg";
import { ScavvyMascot } from "@/src/components/ScavvyMascot";
import { Confetti } from "@/src/components/Confetti";
import { Button, T, TraitBar } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";
import { ai } from "@/src/services/ai";
import { voice } from "@/src/services/voice";

const TRAIT_META = [
  { key: "explorer", label: "Explorer", color: colors.orange },
  { key: "observation", label: "Observation", color: colors.green },
  { key: "curiosity", label: "Curiosity", color: colors.yellow },
  { key: "chaos", label: "Chaos", color: colors.red },
];

export default function AdventureComplete() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { adventure, profile, addStreak, resetAdventure } = useScavvy();

  const done = adventure?.missions.filter((m) => m.status === "done").length ?? 3;
  const totalMissions = adventure?.missions.length ?? 3;
  const totalXp = adventure?.missions.reduce((s, m) => s + (m.earnedXp || 0), 0) ?? 280;

  const [summary, setSummary] = useState<{ summary: string; traits: Record<string, number> } | null>(null);
  const ran = useRef(false);
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    addStreak();
    voice.play("adventure_complete");
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
    ai.adventureSummary({
      name: profile?.name || "Explorer",
      personality: profile?.personality || "explorer",
      style: profile?.style || "RANDOM",
      missionsCompleted: done,
      totalXp,
    }).then((r) => setSummary({ summary: r.summary, traits: r.traits }));
  }, []);

  useEffect(() => () => voice.stop(), []);

  const onShare = () => {
    Share.share({
      message: `I just completed a Scavvy adventure — ${done}/${totalMissions} missions and ${totalXp} XP. Your world is the game!`,
    }).catch(() => {});
  };

  const goHome = () => {
    voice.stop();
    resetAdventure();
    router.replace("/(tabs)/home");
  };

  const goAgain = async () => {
    voice.stop();
    resetAdventure();
    router.replace("/mission/environment");
  };

  return (
    <DarkBg>
      <Confetti count={40} />
      <Pressable testID="complete-home-button" onPress={goHome} style={[styles.backBtn, { top: insets.top + 8 }]} hitSlop={10}>
        <Ionicons name="chevron-back" size={22} color="#FFF6E6" />
        <T weight="bold" size={15} color="#FFF6E6" style={{ marginLeft: 2 }}>
          Home
        </T>
      </Pressable>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 52, paddingBottom: insets.bottom + 24, paddingHorizontal: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ alignItems: "center", transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
          <ScavvyMascot pose="celebrating" size={190} anim="bounce" />
        </Animated.View>

        <T weight="extrabold" size={30} color={colors.yellow} center style={{ marginTop: spacing.md, letterSpacing: 1 }} testID="complete-headline">
          ADVENTURE COMPLETE
        </T>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <T weight="extrabold" size={22} color="#fff">{done}/{totalMissions}</T>
            <T weight="medium" size={11} color="#C9B79E">missions</T>
          </View>
          <View style={styles.statBox}>
            <T weight="extrabold" size={22} color={colors.orange}>{totalXp}</T>
            <T weight="medium" size={11} color="#C9B79E">XP</T>
          </View>
          <View style={styles.statBox}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="flame" size={20} color={colors.orange} />
              <T weight="extrabold" size={22} color="#fff" style={{ marginLeft: 4 }}>+1</T>
            </View>
            <T weight="medium" size={11} color="#C9B79E">streak</T>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="sparkles" size={18} color={colors.yellow} />
          <T weight="semibold" size={15} color="#F4E9D5" style={{ marginTop: 8 }}>
            {summary?.summary || "Reading your detective notes..."}
          </T>
        </View>

        <T weight="bold" size={13} color="#C9B79E" style={{ marginTop: spacing.xl, marginBottom: spacing.md, letterSpacing: 1 }}>
          YOUR ADVENTURE STYLE
        </T>
        <View style={styles.traits}>
          {TRAIT_META.map((t) => (
            <TraitBar key={t.key} label={t.label} value={summary?.traits?.[t.key] ?? 80} color={t.color} />
          ))}
        </View>

        <View style={{ height: spacing.lg }} />
        <Button testID="share-button" label="SHARE MY ADVENTURE" icon="share-social" onPress={onShare} />
        <View style={{ height: spacing.md }} />
        <Button testID="go-again-button" label="GO AGAIN" variant="secondary" icon="refresh" onPress={goAgain} />
      </ScrollView>
    </DarkBg>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    position: "absolute",
    left: spacing.base,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingRight: 10,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xl, gap: spacing.md },
  statBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.charcoalSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    gap: 2,
  },
  summaryCard: {
    backgroundColor: colors.charcoalSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,193,7,0.25)",
  },
  traits: {
    backgroundColor: colors.charcoalSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
