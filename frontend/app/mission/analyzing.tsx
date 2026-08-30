import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot } from "@/src/components/ScavvyMascot";
import { T } from "@/src/components/ui";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";
import { ai } from "@/src/services/ai";

const STATUSES = [
  "Scavvy is investigating...",
  "Looking closer...",
  "One suspicious object detected...",
];

export default function Analyzing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { index = "0", attempt = "1", uri = "" } = useLocalSearchParams<{ index: string; attempt: string; uri: string }>();
  const { adventure, profile } = useScavvy();

  const [statusIdx, setStatusIdx] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;

  const idx = parseInt(index, 10) || 0;
  const mission = adventure?.missions[idx];

  useEffect(() => {
    Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
    ).start();

    const interval = setInterval(() => {
      setStatusIdx((i) => Math.min(i + 1, STATUSES.length - 1));
    }, 850);

    let cancelled = false;
    const run = async () => {
      const [result] = await Promise.all([
        ai.analyzeImage({
          missionTitle: mission?.title || "Find something interesting.",
          missionIndex: idx,
          difficulty: mission?.difficulty || "Easy",
          personality: profile?.personality || "explorer",
          style: profile?.style || "RANDOM",
          attempt: parseInt(attempt, 10) || 1,
        }),
        new Promise((r) => setTimeout(r, 2700)),
      ]);
      if (cancelled) return;
      if (result.success) {
        router.replace({
          pathname: "/mission/success",
          params: { index: String(idx), uri: String(uri), xp: String(result.xp), line: result.scavvy_line },
        });
      } else {
        router.replace({
          pathname: "/mission/failure",
          params: { index: String(idx), attempt: String(attempt), uri: String(uri), reason: result.reasoning },
        });
      }
    };
    run();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <CreamBg decorate={false}>
      <View style={[styles.container, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.photoWrap}>
          {uri ? (
            <Image source={{ uri: String(uri) }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photo, styles.placeholder]}>
              <Ionicons name="image" size={54} color={colors.brownSoft} />
            </View>
          )}
          {/* scanning sweep */}
          <Animated.View
            style={[
              styles.sweep,
              {
                transform: [{ translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [0, 260] }) }],
              },
            ]}
          />
          <View style={styles.magnifier}>
            <ScavvyMascot pose="detective" size={130} anim="wiggle" />
          </View>
        </View>

        <View style={styles.statusRow}>
          <Ionicons name="search" size={18} color={colors.orange} />
          <T weight="bold" size={17} color={colors.charcoal} style={{ marginLeft: 8 }} testID="analyzing-status">
            {STATUSES[statusIdx]}
          </T>
        </View>
        <T weight="medium" size={13} color={colors.brownSoft} center style={{ marginTop: 6 }}>
          Scavvy is using his very serious detective brain.
        </T>
      </View>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl, alignItems: "center", justifyContent: "center" },
  photoWrap: {
    width: 280,
    height: 300,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.card,
    ...shadow.soft,
    borderWidth: 4,
    borderColor: "#fff",
  },
  photo: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.softCream },
  sweep: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(255,138,0,0.28)",
    borderColor: "rgba(255,138,0,0.7)",
    borderTopWidth: 2,
    borderBottomWidth: 2,
  },
  magnifier: { position: "absolute", bottom: -6, right: -14 },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xxl },
});
