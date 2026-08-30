import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View, Pressable, Platform } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot } from "@/src/components/ScavvyMascot";
import { Button, Card, SpeechBubble, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { TAB_BAR_HEIGHT } from "@/src/components/GlassTabBar";
import { useScavvy, levelFromMissions, levelTitle } from "@/src/state/ScavvyContext";
import { DEMO_ADVENTURES } from "@/src/data/demo";

function MetaChip({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string; }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={15} color={colors.orange} />
      <T weight="semibold" size={13} color={colors.charcoal} style={{ marginLeft: 5 }}>{text}</T>
    </View>
  );
}

function StatCard({ icon, color, value, label }: { icon: keyof typeof Ionicons.glyphMap; color: string; value: string; label: string; }) {
  return (
    <Card style={styles.statCard}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons name={icon} size={18} color={color} />
        <T weight="extrabold" size={20} color={colors.charcoal} style={{ marginLeft: 6 }}>{value}</T>
      </View>
      <T weight="medium" size={12} color={colors.brown} style={{ marginTop: 2 }}>{label}</T>
    </Card>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, progress } = useScavvy();

  useFocusEffect(useCallback(() => { Haptics.selectionAsync().catch(() => {}); }, []));

  const name = profile?.name || "Explorer";
  const level = levelFromMissions(progress.totalMissions);
  const title = levelTitle(profile?.personality || "explorer");
  const last = DEMO_ADVENTURES[0];

  const onStart = () => router.push("/mission/environment");

  return (
    <CreamBg decorate={false}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <T weight="extrabold" size={26} color={colors.charcoal}>Hey, {name}</T>
          <T weight="semibold" size={14} color={colors.brown} style={{ marginTop: 2 }}>{title} · Level {level}</T>
        </View>
        <Pressable testID="profile-icon" onPress={() => router.push("/(tabs)/profile")} style={styles.avatar}>
          <ScavvyMascot pose="face_happy" size={40} anim="none" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: Platform.OS === "web" ? insets.bottom + TAB_BAR_HEIGHT + spacing.xl : spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mascotRow}>
          <ScavvyMascot pose="welcome" size={128} anim="float" testID="home-mascot" />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <SpeechBubble testID="home-bubble" text="Something nearby is hiding in plain sight." />
          </View>
        </View>

        <Card style={styles.adventureCard} testID="todays-adventure-card">
          <T weight="bold" size={12} color={colors.orange} style={{ letterSpacing: 1 }}>{"TODAY'S ADVENTURE"}</T>
          <View style={styles.metaRow}>
            <MetaChip icon="time-outline" text="5 min" />
            <MetaChip icon="flag" text="3 missions" />
            <MetaChip icon="flash" text="Easy" />
          </View>
          <View style={{ marginTop: spacing.lg }}>
            <Button testID="start-adventure-button" label="START ADVENTURE" icon="play" onPress={onStart} />
          </View>
        </Card>

        <T weight="bold" size={13} color={colors.brown} style={styles.sectionTitle}>YOUR STATS</T>
        <View style={styles.statsRow}>
          <StatCard icon="flame" color={colors.orange} value={`${progress.streak}`} label="day streak" />
          <StatCard icon="star" color={colors.yellow} value={`${progress.totalMissions}`} label="missions" />
          <StatCard icon="compass" color={colors.green} value={`Lv ${level}`} label={title} />
        </View>

        <Pressable testID="last-time-card" onPress={() => router.push(`/adventure/${last.id}`)}>
          <Card style={styles.lastCard}>
            <View style={styles.lastMascot}>
              <ScavvyMascot pose="sleeping" size={64} anim="none" />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <T weight="bold" size={11} color={colors.brown} style={{ letterSpacing: 1 }}>LAST TIME</T>
              <T weight="extrabold" size={18} color={colors.charcoal} style={{ marginTop: 2 }}>{last.title}</T>
            </View>
            <T weight="extrabold" size={16} color={colors.orange}>+{last.xp} XP</T>
          </Card>
        </Pressable>
      </ScrollView>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.softCream, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1.5, borderColor: colors.line },
  mascotRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.lg },
  adventureCard: { padding: spacing.xl },
  metaRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.base, flexWrap: "wrap" },
  metaChip: { flexDirection: "row", alignItems: "center", backgroundColor: colors.softCream, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.md, letterSpacing: 0.5 },
  statsRow: { flexDirection: "row", gap: spacing.md },
  statCard: { flex: 1, padding: spacing.base },
  lastCard: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg, backgroundColor: colors.softCream, borderColor: colors.line },
  lastMascot: { width: 60, height: 60, alignItems: "center", justifyContent: "center" },
});
