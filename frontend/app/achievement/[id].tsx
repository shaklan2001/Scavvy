import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { Confetti } from "@/src/components/Confetti";
import { ScavvyMascot, MascotBlob } from "@/src/components/ScavvyMascot";
import { Button, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { achievementById } from "@/src/data/demo";

export default function AchievementDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = achievementById(String(id));
  const back = () => router.replace("/(tabs)/profile");

  if (!a) {
    return (
      <CreamBg>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <T weight="bold" size={18} color={colors.charcoal}>Achievement not found.</T>
          <View style={{ height: spacing.lg }} />
          <Button label="BACK" icon="arrow-back" onPress={back} />
        </View>
      </CreamBg>
    );
  }

  const pct = Math.round((a.current / a.total) * 100);

  return (
    <CreamBg decorate={false}>
      {a.unlocked && <Confetti count={24} />}
      <Pressable testID="achievement-back" onPress={back} style={[styles.back, { top: insets.top + 8 }]} hitSlop={10}>
        <Ionicons name="chevron-back" size={22} color={colors.charcoal} />
        <T weight="bold" size={15} color={colors.charcoal} style={{ marginLeft: 2 }}>Profile</T>
      </Pressable>

      <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.hero}>
          <MascotBlob size={200} color="#FFDFA6" />
          <ScavvyMascot pose={a.unlocked ? "celebrating" : "curious"} size="lg" anim={a.unlocked ? "bounce" : "breathe"} />
        </View>

        <View style={styles.iconBadge}>
          <Ionicons name={a.icon} size={40} color={a.unlocked ? colors.orange : colors.brownSoft} />
        </View>

        <T weight="extrabold" size={28} color={colors.charcoal} center style={{ marginTop: spacing.md }}>{a.title}</T>
        <T weight="medium" size={16} color={colors.brown} center style={{ marginTop: 8 }}>{a.desc}</T>

        <View style={styles.progressWrap}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <T weight="bold" size={14} color={colors.charcoal}>{a.current} / {a.total}</T>
            <T weight="bold" size={14} color={a.unlocked ? colors.green : colors.orange}>{a.unlocked ? "UNLOCKED" : `${pct}%`}</T>
          </View>
          <View style={styles.track}><View style={[styles.fill, { width: `${pct}%`, backgroundColor: a.unlocked ? colors.green : colors.orange }]} /></View>
        </View>

        <View style={styles.rewardPill}>
          <Ionicons name="star" size={18} color="#fff" />
          <T weight="extrabold" size={16} color="#fff" style={{ marginLeft: 6 }}>+{a.reward} XP reward</T>
        </View>

        <View style={{ flex: 1 }} />
        <Button testID="achievement-back-button" label="BACK TO PROFILE" icon="arrow-back" onPress={back} />
      </View>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  back: { position: "absolute", left: spacing.base, zIndex: 10, flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingRight: 10 },
  container: { flex: 1, paddingHorizontal: spacing.xl, alignItems: "center" },
  hero: { alignItems: "center", justifyContent: "center", height: 200 },
  iconBadge: { width: 76, height: 76, borderRadius: radius.lg, backgroundColor: colors.yellow + "33", alignItems: "center", justifyContent: "center", marginTop: -8 },
  progressWrap: { alignSelf: "stretch", marginTop: spacing.xl },
  track: { height: 12, borderRadius: 6, backgroundColor: colors.line, overflow: "hidden" },
  fill: { height: 12, borderRadius: 6 },
  rewardPill: { flexDirection: "row", alignItems: "center", backgroundColor: colors.orange, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.pill, marginTop: spacing.xl },
});
