import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyLogo } from "@/src/components/ScavvyMascot";
import { useScavvy } from "@/src/state/ScavvyContext";

export default function Splash() {
  const router = useRouter();
  const { ready, profile } = useScavvy();
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [logoAnim]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      if (profile) router.replace("/(tabs)/home");
      else router.replace("/onboarding/welcome");
    }, 1650);
    return () => clearTimeout(timer);
  }, [ready, profile, router]);

  return (
    <CreamBg decorate={false}>
      <View style={styles.center} testID="splash-screen">
        <Animated.View
          style={{
            opacity: logoAnim,
            transform: [
              { scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) },
            ],
          }}
        >
          <ScavvyLogo width={320} />
        </Animated.View>
      </View>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
});
