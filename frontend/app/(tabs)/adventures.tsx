import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View, Pressable, Platform } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CreamBg } from "@/src/components/Bg";
import { Card, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { TAB_BAR_HEIGHT } from "@/src/components/GlassTabBar";
import { DEMO_ADVENTURES, TOTAL_SESSIONS, TOTAL_XP_EARNED } from "@/src/data/demo";

function Pill({ icon, text, color = colors.charcoal }: { icon: keyof typeof Ionicons.glyphMap; text: string; color?: string; }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={14} color={colors.orange} />
      <T weight="semibold" size={12} color={color} style={{ marginLeft: 4 }}>{text}</T>
    </View>
  );
}

export default function Adventures() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useFocusEffect(useCallback(() => { Haptics.selectionAsync().catch(() => {}); }, []));

  return (
    <CreamBg decorate={false}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <T weight="extrabold" size={30} color={colors.charcoal}>Adventures</T>
        <T weight="semibold" size={14} color={colors.brown} style={{ marginTop: 2 }}>
          {TOTAL_SESSIONS} sessions · {TOTAL_XP_EARNED.toLocaleString()} XP earned
        </T>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: Platform.OS === "web" ? insets.bottom + TAB_BAR_HEIGHT + spacing.xl : spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {DEMO_ADVENTURES.map((a) => (
          <Pressable key={a.id} testID={`adventure-card-${a.id}`} onPress={() => router.push(`/adventure/${a.id}`)}>
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <T weight="bold" size={11} color={colors.brownSoft} style={{ letterSpacing: 0.5 }}>{a.when}</T>
                  <T weight="extrabold" size={20} color={colors.charcoal} style={{ marginTop: 2 }}>{a.title}</T>
                  <T weight="medium" size={14} color={colors.brown} style={{ marginTop: 4 }}>{a.summary}</T>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.brownSoft} style={{ marginLeft: spacing.sm }} />
              </View>
              <View style={styles.pillRow}>
                <Pill icon="flag" text={`${a.missionsCount} missions`} />
                <Pill icon="star" text={`${a.xp} XP`} color={colors.orange} />
                <Pill icon="time-outline" text={`${a.minutes} min`} />
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  card: { marginBottom: spacing.base, padding: spacing.lg },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  pillRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.base, flexWrap: "wrap" },
  pill: { flexDirection: "row", alignItems: "center", backgroundColor: colors.softCream, paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.pill },
});
