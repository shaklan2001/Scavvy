import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScavvyMascot } from "@/src/components/ScavvyMascot";
import { Confetti } from "@/src/components/Confetti";
import { Button, T } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";
import { voice } from "@/src/services/voice";

export default function Success() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { adventure, completeMission } = useScavvy();
  const { index = "0", uri = "", xp = "100", line = "" } = useLocalSearchParams<{ index: string; uri: string; xp: string; line: string }>();

  const idx = parseInt(index, 10) || 0;
  const xpNum = parseInt(xp, 10) || 100;
  const total = adventure?.missions.length ?? 3;
  const isLast = idx >= total - 1;

  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    completeMission(idx, xpNum, String(line), uri ? String(uri) : null);
    voice.play("successReaction");
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5, tension: 90 }).start();
  }, []);

  const next = () => {
    if (isLast) router.replace("/adventure-complete");
    else router.replace("/mission/reveal");
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#FFE39A", "#FFF1D6"]} style={StyleSheet.absoluteFill} />
      <Confetti count={26} />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 30, paddingBottom: insets.bottom + 24, paddingHorizontal: spacing.xl, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <T weight="extrabold" size={32} color={colors.charcoal} center testID="success-headline">
          THAT COUNTS! 🎉
        </T>

        <Animated.View
          style={{
            marginTop: spacing.lg,
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          }}
        >
          <ScavvyMascot pose="success" size={190} anim="bounce" />
        </Animated.View>

        <View style={styles.photoCard}>
          {uri ? (
            <Image source={{ uri: String(uri) }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photo, styles.placeholder]}>
              <Ionicons name="paw" size={44} color={colors.orange} />
            </View>
          )}
        </View>

        <View style={styles.explain}>
          <Ionicons name="chatbubble-ellipses" size={18} color={colors.orange} />
          <T weight="semibold" size={15} color={colors.charcoal} style={{ marginLeft: 8, flex: 1 }}>
            {String(line) || "Yep. That absolutely counts."}
          </T>
        </View>

        <View style={styles.xpBadge}>
          <T weight="extrabold" size={26} color="#fff">
            +{xpNum} XP
          </T>
        </View>
        <T weight="bold" size={13} color={colors.green} style={{ marginTop: spacing.sm, letterSpacing: 1 }}>
          MISSION COMPLETE
        </T>

        <View style={{ height: spacing.xl }} />
        <Button
          testID="next-mission-button"
          label={isLast ? "SEE MY RESULTS" : "NEXT MISSION"}
          icon="arrow-forward"
          onPress={next}
        />
        <View style={{ height: spacing.md }} />
        <Button
          testID="play-scavvy-button"
          label="PLAY SCAVVY 🔊"
          variant="secondary"
          icon="volume-high"
          onPress={() => {
            voice.play("successReaction");
            toast.show(voice.caption("successReaction"), "volume-high");
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  photoCard: {
    width: 200,
    height: 200,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#fff",
    ...shadow.soft,
    marginTop: spacing.lg,
  },
  photo: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.softCream },
  explain: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: spacing.base,
    marginTop: spacing.lg,
    ...shadow.card,
  },
  xpBadge: {
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    ...shadow.button,
  },
});
