import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AdventureBg } from "@/src/components/Bg";
import { ScavvyMascot } from "@/src/components/ScavvyMascot";
import { Button, T } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";
import { voice } from "@/src/services/voice";

export default function MissionReveal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { adventure } = useScavvy();

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const paws = useRef([...Array(4)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();
    Animated.loop(
      Animated.stagger(180, paws.map((p) =>
        Animated.sequence([
          Animated.timing(p, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(p, { toValue: 0.2, duration: 400, useNativeDriver: true }),
        ])
      ))
    ).start();
    voice.play("mission_intro");
  }, []);

  useEffect(() => {
    if (!adventure) router.replace("/(tabs)/home");
  }, [adventure]);

  if (!adventure) {
    return null;
  }

  const idx = adventure.currentIndex;
  const mission = adventure.missions[idx];
  const label = `MISSION ${String(idx + 1).padStart(2, "0")}`;

  return (
    <AdventureBg>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Pressable testID="reveal-back" onPress={() => router.replace("/(tabs)/home")} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.charcoal} />
          <T weight="bold" size={15} color={colors.charcoal} style={{ marginLeft: 2 }}>
            Back
          </T>
        </Pressable>

        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }], marginTop: spacing.xxl }}>
          <View style={styles.badge}>
            <Ionicons name="paw" size={14} color="#fff" />
            <T weight="bold" size={12} color="#fff" style={{ marginLeft: 6, letterSpacing: 1 }}>
              {label}
            </T>
          </View>
          <T weight="extrabold" size={38} color={colors.charcoal} style={{ marginTop: spacing.lg, lineHeight: 44 }} testID="mission-title">
            {mission.title}
          </T>
          <T weight="semibold" size={16} color={colors.charcoalSoft} style={{ marginTop: spacing.base, opacity: 0.75 }}>
            {mission.hint}
          </T>
        </Animated.View>

        <View style={styles.pawTrail}>
          {paws.map((p, i) => (
            <Animated.View key={i} style={{ opacity: p, transform: [{ rotate: i % 2 ? "12deg" : "-12deg" }] }}>
              <Ionicons name="paw" size={20} color="rgba(23,18,15,0.35)" />
            </Animated.View>
          ))}
        </View>

        <View style={styles.mascotWrap} pointerEvents="none">
          <ScavvyMascot pose="detective" size={230} anim="float" />
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Button
            testID="find-it-button"
            label="FIND IT"
            icon="search"
            onPress={() => router.push({ pathname: "/mission/camera", params: { index: String(idx), attempt: "1" } })}
          />
        </View>
      </View>
    </AdventureBg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  back: { position: "absolute", left: spacing.base, top: 0, marginTop: 0, padding: spacing.sm, zIndex: 5, flexDirection: "row", alignItems: "center" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.charcoal,
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pawTrail: { flexDirection: "row", gap: 12, marginTop: spacing.xl, marginLeft: spacing.xs },
  mascotWrap: { position: "absolute", bottom: 96, right: -10, alignItems: "center" },
  footer: { position: "absolute", left: spacing.xl, right: spacing.xl, bottom: 0 },
});
