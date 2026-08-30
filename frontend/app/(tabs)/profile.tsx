import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View, Pressable, Platform, Modal } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, MascotBlob } from "@/src/components/ScavvyMascot";
import { Button, Card, T } from "@/src/components/ui";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { TAB_BAR_HEIGHT } from "@/src/components/GlassTabBar";
import { useScavvy, levelFromMissions, levelTitle } from "@/src/state/ScavvyContext";
import { ACHIEVEMENTS, levelInfo, LEVEL_SIZE } from "@/src/data/demo";
import { STYLES } from "@/src/data/content";

function StatCard({ icon, color, value, label }: { icon: keyof typeof Ionicons.glyphMap; color: string; value: string; label: string; }) {
  return (
    <Card style={styles.statCard}>
      <Ionicons name={icon} size={22} color={color} />
      <T weight="extrabold" size={20} color={colors.charcoal} style={{ marginTop: 4 }}>{value}</T>
      <T weight="medium" size={11} color={colors.brown}>{label}</T>
    </Card>
  );
}

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, progress, resetDemo } = useScavvy();
  const [confirm, setConfirm] = useState(false);
  useFocusEffect(useCallback(() => { Haptics.selectionAsync().catch(() => {}); }, []));

  const level = levelFromMissions(progress.totalMissions);
  const title = levelTitle(profile?.personality || "explorer");
  const { inLevel } = levelInfo(progress.xp, level);
  const fav = STYLES.find((s) => s.key === (profile?.style || "RANDOM"));

  const doReset = async () => { setConfirm(false); await resetDemo(); };

  return (
    <CreamBg decorate={false}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: insets.top + 16, paddingBottom: Platform.OS === "web" ? insets.bottom + TAB_BAR_HEIGHT + spacing.xl : spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <MascotBlob size={150} color="#FFDFA6" />
          <ScavvyMascot pose="idle" size={128} anim="breathe" />
        </View>
        <T weight="extrabold" size={26} color={colors.charcoal} center>Hey, {profile?.name || "Explorer"}</T>
        <T weight="semibold" size={14} color={colors.brown} center style={{ marginTop: 2 }}>{title} · Level {level}</T>

        {/* XP progress */}
        <Card style={styles.xpCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <T weight="bold" size={13} color={colors.charcoal}>Level {level}</T>
            <T weight="bold" size={13} color={colors.orange}>{inLevel} / {LEVEL_SIZE} XP</T>
          </View>
          <View style={styles.track}><View style={[styles.fill, { width: `${(inLevel / LEVEL_SIZE) * 100}%` }]} /></View>
        </Card>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="star" color={colors.yellow} value={`${progress.totalMissions}`} label="missions" />
          <StatCard icon="flame" color={colors.orange} value={`${progress.streak}`} label="day streak" />
          <StatCard icon="map" color={colors.green} value={`${progress.adventures}`} label="adventures" />
        </View>

        {/* Favourite */}
        <Card style={styles.favCard}>
          <T weight="bold" size={12} color={colors.brown} style={{ letterSpacing: 0.5 }}>FAVOURITE ADVENTURE</T>
          <T weight="extrabold" size={22} color={colors.charcoal} style={{ marginTop: 4 }}>{fav?.title || "RANDOM"}</T>
        </Card>

        {/* Achievements */}
        <T weight="extrabold" size={20} color={colors.charcoal} style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>My Achievements</T>
        {ACHIEVEMENTS.map((a) => (
          <Pressable key={a.id} testID={`achievement-${a.id}`} onPress={() => router.push(`/achievement/${a.id}`)}>
            <Card style={[styles.achCard, !a.unlocked && styles.achLocked]}>
              <View style={styles.achRow}>
                <View style={[styles.achIcon, !a.unlocked && { backgroundColor: "rgba(0,0,0,0.05)" }]}>
                  <Ionicons name={a.icon} size={22} color={a.unlocked ? colors.orange : colors.brownSoft} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <T weight="extrabold" size={16} color={colors.charcoal}>{a.title}</T>
                    {!a.unlocked && <View style={styles.lockedPill}><T weight="bold" size={10} color={colors.brown}>LOCKED</T></View>}
                  </View>
                  <T weight="medium" size={13} color={colors.brown} style={{ marginTop: 2 }}>{a.desc}</T>
                </View>
                {a.unlocked
                  ? <Ionicons name="checkmark-circle" size={22} color={colors.green} />
                  : <T weight="bold" size={13} color={colors.orange}>{Math.round((a.current / a.total) * 100)}%</T>}
              </View>
              {!a.unlocked && (
                <View style={[styles.track, { marginTop: spacing.md }]}>
                  <View style={[styles.fill, { width: `${(a.current / a.total) * 100}%` }]} />
                </View>
              )}
            </Card>
          </Pressable>
        ))}

        <View style={{ height: spacing.xl }} />
        <Button testID="reset-button" label="RESET DEMO DATA" variant="secondary" icon="refresh" onPress={() => setConfirm(true)} />
      </ScrollView>

      <Modal visible={confirm} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <ScavvyMascot pose="curious" size={90} anim="none" />
            <T weight="extrabold" size={20} color={colors.charcoal} center style={{ marginTop: spacing.sm }}>Reset demo data?</T>
            <T weight="medium" size={14} color={colors.brown} center style={{ marginTop: 6 }}>This restores your stats and streak to the demo defaults.</T>
            <View style={{ height: spacing.lg }} />
            <Button testID="confirm-reset-button" label="YES, RESET" icon="refresh" onPress={doReset} />
            <View style={{ height: spacing.sm }} />
            <Button testID="cancel-reset-button" label="Cancel" variant="ghost" onPress={() => setConfirm(false)} />
          </View>
        </View>
      </Modal>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", justifyContent: "center", height: 150, marginBottom: spacing.sm },
  xpCard: { marginTop: spacing.lg, padding: spacing.lg },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.line, overflow: "hidden" },
  fill: { height: 10, borderRadius: 5, backgroundColor: colors.orange },
  statsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.base },
  statCard: { flex: 1, alignItems: "center", paddingVertical: spacing.base, gap: 2 },
  favCard: { marginTop: spacing.base, backgroundColor: colors.softCream, borderColor: colors.line },
  achCard: { marginBottom: spacing.md, padding: spacing.base },
  achLocked: { backgroundColor: colors.softCream, borderColor: colors.line },
  achRow: { flexDirection: "row", alignItems: "center" },
  achIcon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.yellow + "33", alignItems: "center", justifyContent: "center" },
  lockedPill: { marginLeft: spacing.sm, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  modalWrap: { flex: 1, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  modalCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", alignSelf: "stretch", ...shadow.soft },
});
