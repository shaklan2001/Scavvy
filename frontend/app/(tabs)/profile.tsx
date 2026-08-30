import React from "react";
import { ScrollView, StyleSheet, View, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, MascotBlob } from "@/src/components/ScavvyMascot";
import { Button, Card, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { TAB_BAR_HEIGHT } from "@/src/components/GlassTabBar";
import { PERSONALITIES } from "@/src/data/content";
import { useScavvy, levelFromMissions, levelTitle } from "@/src/state/ScavvyContext";

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, progress, logout } = useScavvy();

  const persona = PERSONALITIES.find((p) => p.key === (profile?.personality || "explorer"));
  const level = levelFromMissions(progress.totalMissions);

  const doLogout = async () => {
    await logout();
    router.replace("/onboarding/welcome");
  };

  return (
    <CreamBg decorate={false}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: insets.top + 16, paddingBottom: Platform.OS === "web" ? insets.bottom + TAB_BAR_HEIGHT + spacing.xl : spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <MascotBlob size={180} color="#FFDFA6" />
          <ScavvyMascot pose="idle" size={150} anim="breathe" />
        </View>

        <T weight="extrabold" size={28} color={colors.charcoal} center>
          {profile?.name || "Explorer"}
        </T>
        <View style={styles.personaBadge}>
          <Ionicons name={(persona?.icon as any) || "compass"} size={16} color={colors.orange} />
          <T weight="bold" size={12} color={colors.orange} style={{ marginLeft: 6 }}>
            {persona?.title || "THE EXPLORER"}
          </T>
        </View>

        <Card style={styles.statsCard} testID="profile-stats">
          <View style={styles.stat}>
            <Ionicons name="flame" size={24} color={colors.orange} />
            <T weight="extrabold" size={20} color={colors.charcoal}>{progress.streak}</T>
            <T weight="medium" size={11} color={colors.brown}>day streak</T>
          </View>
          <View style={styles.vline} />
          <View style={styles.stat}>
            <Ionicons name="star" size={24} color={colors.yellow} />
            <T weight="extrabold" size={20} color={colors.charcoal}>{progress.totalMissions}</T>
            <T weight="medium" size={11} color={colors.brown}>missions</T>
          </View>
          <View style={styles.vline} />
          <View style={styles.stat}>
            <Ionicons name="compass" size={24} color={colors.green} />
            <T weight="extrabold" size={20} color={colors.charcoal}>Lv {level}</T>
            <T weight="medium" size={11} color={colors.brown}>{levelTitle(profile?.personality || "explorer")}</T>
          </View>
        </Card>

        <Card style={{ marginTop: spacing.base, flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="ribbon" size={22} color={colors.yellow} />
          <T weight="semibold" size={14} color={colors.charcoal} style={{ marginLeft: spacing.md, flex: 1 }}>
            {progress.xp.toLocaleString()} XP earned exploring
          </T>
        </Card>

        <View style={{ height: spacing.xl }} />
        <Button
          testID="change-style-button"
          label="Change my style"
          variant="secondary"
          icon="options"
          onPress={() => router.push("/onboarding/style")}
        />
        <View style={{ height: spacing.md }} />
        <Button testID="reset-button" label="Reset Scavvy" variant="ghost" icon="refresh" onPress={doLogout} />
      </ScrollView>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", justifyContent: "center", height: 180, marginBottom: spacing.sm },
  personaBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.softCream,
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  statsCard: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.lg, marginTop: spacing.xl },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  vline: { width: 1, height: 44, backgroundColor: colors.line },
});
