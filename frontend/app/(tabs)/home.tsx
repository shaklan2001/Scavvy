import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot } from "@/src/components/ScavvyMascot";
import { Button, Card, SpeechBubble, T } from "@/src/components/ui";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { TAB_BAR_HEIGHT } from "@/src/components/GlassTabBar";
import { useScavvy, levelFromMissions, levelTitle } from "@/src/state/ScavvyContext";

function MetaChip({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={15} color={colors.orange} />
      <T weight="semibold" size={13} color={colors.charcoal} style={{ marginLeft: 5 }}>
        {text}
      </T>
    </View>
  );
}

function ProgressStat({ icon, color, value, label }: { icon: keyof typeof Ionicons.glyphMap; color: string; value: string; label: string }) {
  return (
    <View style={styles.progressStat}>
      <Ionicons name={icon} size={22} color={color} />
      <T weight="extrabold" size={18} color={colors.charcoal} style={{ marginTop: 4 }}>
        {value}
      </T>
      <T weight="medium" size={11} color={colors.brown} center>
        {label}
      </T>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, progress, startAdventure } = useScavvy();
  const [loading, setLoading] = useState(false);

  const name = profile?.name || "Explorer";
  const level = levelFromMissions(progress.totalMissions);

  const onStart = async () => {
    setLoading(true);
    try {
      await startAdventure();
      router.push("/mission/reveal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreamBg decorate={false}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <T weight="medium" size={14} color={colors.brown}>
            Welcome back,
          </T>
          <T weight="extrabold" size={24} color={colors.charcoal}>
            Hey, {name}
          </T>
        </View>
        <Pressable testID="profile-icon" onPress={() => router.push("/(tabs)/profile")} style={styles.avatar}>
          <Ionicons name="person" size={22} color={colors.orange} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot + speech bubble */}
        <View style={styles.mascotRow}>
          <ScavvyMascot pose="welcome" size={130} anim="float" testID="home-mascot" />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <SpeechBubble testID="home-bubble" text="Psst... I found something." />
          </View>
        </View>

        {/* Today's adventure */}
        <Card style={styles.adventureCard} testID="todays-adventure-card">
          <View style={styles.badgeRow}>
            <View style={styles.liveBadge}>
              <Ionicons name="sparkles" size={13} color="#fff" />
              <T weight="bold" size={11} color="#fff" style={{ marginLeft: 5 }}>
                TODAY'S ADVENTURE
              </T>
            </View>
          </View>
          <T weight="extrabold" size={22} color={colors.charcoal} style={{ marginTop: spacing.md }}>
            A fresh trail awaits
          </T>
          <View style={styles.metaRow}>
            <MetaChip icon="time" text="5 min" />
            <MetaChip icon="flag" text="3 missions" />
            <MetaChip icon="trending-up" text="Easy" />
          </View>
          <View style={{ marginTop: spacing.lg }}>
            <Button
              testID="start-adventure-button"
              label={loading ? "SUMMONING SCAVVY..." : "START ADVENTURE"}
              icon={loading ? undefined : "play"}
              onPress={onStart}
              disabled={loading}
            />
            {loading && (
              <ActivityIndicator color={colors.orange} style={{ position: "absolute", left: 22, top: 18 }} />
            )}
          </View>
        </Card>

        {/* Progress */}
        <T weight="bold" size={13} color={colors.brown} style={{ marginTop: spacing.xl, marginBottom: spacing.md, letterSpacing: 0.5 }}>
          YOUR PROGRESS
        </T>
        <Card style={styles.progressCard} testID="progress-card">
          <ProgressStat icon="flame" color={colors.orange} value={`${progress.streak}`} label="day streak" />
          <View style={styles.vline} />
          <ProgressStat icon="star" color={colors.yellow} value={`${progress.totalMissions}`} label="missions" />
          <View style={styles.vline} />
          <ProgressStat icon="compass" color={colors.green} value={`Lv ${level}`} label={levelTitle(profile?.personality || "explorer")} />
        </Card>
      </ScrollView>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.softCream,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  mascotRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.lg },
  adventureCard: { padding: spacing.xl },
  badgeRow: { flexDirection: "row" },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  metaRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.base, flexWrap: "wrap" },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.softCream,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  progressCard: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.lg },
  progressStat: { flex: 1, alignItems: "center" },
  vline: { width: 1, height: 44, backgroundColor: colors.line },
});
