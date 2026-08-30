import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, MascotBlob } from "@/src/components/ScavvyMascot";
import { T } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";
import { peekScanImages } from "@/src/state/pending-scan";
import { ai } from "@/src/services/ai";

const STATUS = ["Scavvy is looking around...", "Interesting...", "I've got some ideas."];

export default function AnalyzingEnv() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { location = "Home" } = useLocalSearchParams<{ location: string }>();
  const { scanImages, setEnv, loadQuests } = useScavvy();
  const [idx, setIdx] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
    const iv = setInterval(() => setIdx((i) => Math.min(i + 1, STATUS.length - 1)), 1200);

    let cancelled = false;
    (async () => {
      const start = Date.now();
      try {
        const photos = peekScanImages().length > 0 ? peekScanImages() : (scanImages || []);
        const res = await ai.analyzeEnvironment(String(location), photos);
        const quests = await ai.generateQuests(String(location), res.environment);
        const elapsed = Date.now() - start;
        if (elapsed < 3200) await new Promise((r) => setTimeout(r, 3200 - elapsed));
        if (cancelled) return;
        setEnv(res.environment);
        loadQuests(quests);
        router.replace("/mission/quests");
      } catch (error) {
        if (__DEV__) console.warn("[scavvy] environment analysis failed", error instanceof Error ? error.name : "unknown");
        if (cancelled) return;
        const res = await ai.analyzeEnvironment(String(location), []);
        const quests = await ai.generateQuests(String(location), res.environment);
        setEnv(res.environment);
        loadQuests(quests);
        router.replace("/mission/quests");
      }
    })();

    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <CreamBg decorate={false}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.hero}>
          <MascotBlob size={260} color="#FFDFA6" />
          <Animated.View style={{ transform: [{ scale }] }}>
            <ScavvyMascot pose="detective" size="xl" anim="wiggle" />
          </Animated.View>
        </View>
        <View style={styles.statusRow}>
          <Ionicons name="search" size={18} color={colors.orange} />
          <T weight="bold" size={18} color={colors.charcoal} style={{ marginLeft: 8 }} testID="env-analyzing-status">{STATUS[idx]}</T>
        </View>
        <T weight="medium" size={13} color={colors.brownSoft} center style={{ marginTop: 6 }}>
          Reading the room so your quests fit it perfectly.
        </T>
      </View>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl, alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center", justifyContent: "center", height: 300, marginBottom: spacing.xl },
  statusRow: { flexDirection: "row", alignItems: "center" },
});
