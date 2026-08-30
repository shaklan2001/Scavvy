import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from "react-native";
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
  const { adventure, completeMission, resetAdventure } = useScavvy();
  const { index = "0", uri = "", xp = "100", line = "" } = useLocalSearchParams<{ index: string; uri: string; xp: string; line: string }>();

  const idx = parseInt(index, 10) || 0;
  const xpNum = parseInt(xp, 10) || 100;
  const total = adventure?.missions.length ?? 3;
  const isLast = idx >= total - 1;
  const scavvyLine = String(line) || "That? That's exactly the kind of thing I meant.";

  const [speaking, setSpeaking] = useState(false);
  const [displayXp, setDisplayXp] = useState(0);

  // staged reveal
  const pop = useRef(new Animated.Value(0)).current;
  const headlineOp = useRef(new Animated.Value(0)).current;
  const bodyOp = useRef(new Animated.Value(0)).current;
  const xpOp = useRef(new Animated.Value(0)).current;
  const xpVal = useRef(new Animated.Value(0)).current;
  const completeOp = useRef(new Animated.Value(0)).current;
  const speakerPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    completeMission(idx, xpNum, scavvyLine, uri ? String(uri) : null);

    const id = xpVal.addListener(({ value }) => setDisplayXp(Math.round(value)));

    Animated.sequence([
      Animated.parallel([
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5, tension: 90 }),
        Animated.timing(headlineOp, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]),
      Animated.timing(bodyOp, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(xpOp, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(xpVal, { toValue: xpNum, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]),
      Animated.timing(completeOp, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start(() => {
      // auto-play Scavvy's reaction once the reward has landed
      setSpeaking(true);
      startPulse();
      voice.play("success", () => {
        setSpeaking(false);
        speakerPulse.stopAnimation();
      });
    });

    return () => {
      xpVal.removeListener(id);
      voice.stop();
    };
  }, []);

  const startPulse = () => {
    speakerPulse.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(speakerPulse, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(speakerPulse, { toValue: 0, duration: 420, useNativeDriver: true }),
      ])
    ).start();
  };

  const playScavvy = () => {
    if (speaking) return;
    setSpeaking(true);
    startPulse();
    toast.show(voice.caption("success"), "volume-high");
    voice.play("success", () => {
      setSpeaking(false);
      speakerPulse.stopAnimation();
    });
  };

  const goHome = () => {
    voice.stop();
    resetAdventure();
    router.replace("/(tabs)/home");
  };

  const next = () => {
    voice.stop();
    if (isLast) router.replace("/adventure-complete");
    else router.replace("/mission/reveal");
  };

  const speakerScale = speakerPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#FFE39A", "#FFF1D6"]} style={StyleSheet.absoluteFill} />
      <Confetti count={26} />

      {/* Back / Home */}
      <Pressable testID="success-home-button" onPress={goHome} style={[styles.backBtn, { top: insets.top + 8 }]} hitSlop={10}>
        <Ionicons name="chevron-back" size={22} color={colors.charcoal} />
        <T weight="bold" size={15} color={colors.charcoal} style={{ marginLeft: 2 }}>
          Home
        </T>
      </Pressable>

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24, paddingHorizontal: spacing.xl, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: headlineOp }}>
          <T weight="extrabold" size={32} color={colors.charcoal} center testID="success-headline">
            THAT COUNTS!
          </T>
        </Animated.View>

        <Animated.View style={{ marginTop: spacing.md, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }}>
          <ScavvyMascot pose="success" size={185} anim="bounce" />
        </Animated.View>

        <Animated.View style={[styles.photoCard, { opacity: bodyOp }]}>
          {uri ? (
            <Image source={{ uri: String(uri) }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photo, styles.placeholder]}>
              <Ionicons name="paw" size={44} color={colors.orange} />
            </View>
          )}
        </Animated.View>

        <Animated.View style={{ opacity: bodyOp, alignSelf: "stretch" }}>
          <Pressable testID="success-bubble" onPress={playScavvy} style={styles.explain}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.orange} />
            <T weight="semibold" size={15} color={colors.charcoal} style={{ marginLeft: 8, flex: 1 }}>
              {scavvyLine}
            </T>
            <Ionicons name="volume-medium" size={18} color={colors.brownSoft} />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.xpBadge, { opacity: xpOp }]}>
          <Ionicons name="star" size={20} color="#fff" />
          <T weight="extrabold" size={24} color="#fff" style={{ marginLeft: 6 }}>
            +{displayXp} XP
          </T>
        </Animated.View>

        <Animated.View style={{ opacity: completeOp, flexDirection: "row", alignItems: "center", marginTop: spacing.sm }}>
          <Ionicons name="checkmark-circle" size={16} color={colors.green} />
          <T weight="bold" size={13} color={colors.green} style={{ marginLeft: 4, letterSpacing: 1 }}>
            MISSION COMPLETE
          </T>
        </Animated.View>

        <View style={{ height: spacing.xl }} />
        <Button
          testID="next-mission-button"
          label={isLast ? "SEE MY RESULTS" : "NEXT MISSION"}
          icon="arrow-forward"
          onPress={next}
        />
        <View style={{ height: spacing.md }} />

        <Pressable testID="play-scavvy-button" onPress={playScavvy} disabled={speaking} style={[styles.playBtn, speaking && { opacity: 0.85 }]}>
          <Animated.View style={{ transform: [{ scale: speakerScale }] }}>
            <Ionicons name={speaking ? "volume-high" : "volume-medium"} size={20} color={colors.charcoal} />
          </Animated.View>
          <T weight="bold" size={16} color={colors.charcoal} style={{ marginLeft: 8, letterSpacing: 0.4 }}>
            {speaking ? "SCAVVY IS SPEAKING..." : "PLAY SCAVVY"}
          </T>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: {
    position: "absolute",
    left: spacing.base,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingRight: 10,
  },
  photoCard: {
    width: 200,
    height: 200,
    borderRadius: 24,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    ...shadow.button,
  },
  playBtn: {
    alignSelf: "stretch",
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
});
