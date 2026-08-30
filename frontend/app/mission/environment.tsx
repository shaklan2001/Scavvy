import React, { useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, MascotBlob } from "@/src/components/ScavvyMascot";
import { Button, T } from "@/src/components/ui";
import { colors, radius, shadow, spacing } from "@/src/theme";

const OPTIONS = [
  { key: "Home", icon: "home" },
  { key: "Office", icon: "briefcase" },
  { key: "Campus", icon: "school" },
  { key: "Outdoors", icon: "leaf" },
  { key: "Somewhere Else", icon: "sparkles" },
] as const;

export default function Environment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loc, setLoc] = useState<string>("Home");

  return (
    <CreamBg>
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <Pressable testID="env-back" onPress={() => router.replace("/(tabs)/home")} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.charcoal} />
          <T weight="bold" size={15} color={colors.charcoal} style={{ marginLeft: 2 }}>Home</T>
        </Pressable>

        <T weight="extrabold" size={30} color={colors.charcoal} style={{ marginTop: spacing.xl }}>
          Where are we exploring?
        </T>
        <T weight="medium" size={15} color={colors.brown} style={{ marginTop: 6 }}>
          This helps Scavvy hide better quests.
        </T>

        <View style={styles.grid}>
          {OPTIONS.map((o) => {
            const sel = loc === o.key;
            return (
              <Pressable key={o.key} testID={`loc-${o.key}`} onPress={() => setLoc(o.key)} style={[styles.chip, sel && styles.chipSel]}>
                <Ionicons name={o.icon as any} size={18} color={sel ? "#fff" : colors.orange} />
                <T weight="bold" size={14} color={sel ? "#fff" : colors.charcoal} style={{ marginLeft: 8 }}>{o.key}</T>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.hero}>
          <MascotBlob size={220} color="#FFDFA6" />
          <ScavvyMascot pose="detective" size="lg" anim="wiggle" />
        </View>
        <T weight="extrabold" size={22} color={colors.charcoal} center>Show me around.</T>
        <T weight="medium" size={15} color={colors.brown} center style={{ marginTop: 6, marginBottom: spacing.lg }}>
          Slowly scan the space so Scavvy can hide some quests.
        </T>

        <View style={{ flex: 1 }} />
        <Button testID="scan-my-space-button" label="SCAN MY SPACE" icon="scan" onPress={() => router.push({ pathname: "/mission/scan", params: { location: loc } })} />
      </View>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  back: { position: "absolute", left: spacing.base, top: 0, marginTop: 0, paddingVertical: 6, flexDirection: "row", alignItems: "center", zIndex: 5 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg },
  chip: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: spacing.base, paddingVertical: 12, borderRadius: radius.pill, ...shadow.card },
  chipSel: { backgroundColor: colors.orange, borderColor: colors.orange },
  hero: { alignItems: "center", justifyContent: "center", height: 200, marginTop: spacing.md },
});
