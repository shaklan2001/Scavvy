import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Easing } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, ScavvyLogo, MascotBlob } from "@/src/components/ScavvyMascot";
import { T } from "@/src/components/ui";
import { colors, font } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";

export default function Splash() {
  const router = useRouter();
  const { ready, profile } = useScavvy();

  const mascotAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const paws = useRef([...Array(4)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.stagger(
        130,
        paws.map((p) =>
          Animated.timing(p, { toValue: 1, duration: 260, useNativeDriver: true })
        )
      ),
      Animated.spring(mascotAnim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
      Animated.timing(logoAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      if (profile) router.replace("/(tabs)/home");
      else router.replace("/onboarding/welcome");
    }, 1650);
    return () => clearTimeout(t);
  }, [ready, profile]);

  return (
    <CreamBg decorate={false}>
      <View style={styles.center} testID="splash-screen">
        <View style={styles.mascotWrap}>
          <MascotBlob size={260} />
          <Animated.View
            style={{
              opacity: mascotAnim,
              transform: [
                { scale: mascotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
              ],
            }}
          >
            <ScavvyMascot pose="welcome" size={240} anim="float" />
          </Animated.View>
        </View>

        {/* paw-print trail leading up toward the logo */}
        <View style={styles.pawTrail}>
          {paws.map((p, i) => (
            <Animated.View
              key={i}
              style={{
                opacity: p,
                transform: [
                  { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                  { rotate: i % 2 ? "12deg" : "-12deg" },
                ],
              }}
            >
              <Ionicons name="paw" size={16} color={colors.orange} />
            </Animated.View>
          ))}
        </View>

        <Animated.View
          style={{
            alignItems: "center",
            opacity: logoAnim,
            transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
          }}
        >
          <T weight="extrabold" size={44} color={colors.charcoal} style={{ letterSpacing: 1 }}>
            SCAVVY
          </T>
          <T weight="semibold" size={16} color={colors.orange} style={{ marginTop: 2 }}>
            Your world is the game.
          </T>
        </Animated.View>
      </View>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  mascotWrap: { alignItems: "center", justifyContent: "center", height: 260 },
  pawTrail: { flexDirection: "row", gap: 14, marginVertical: 18, alignItems: "center" },
});
