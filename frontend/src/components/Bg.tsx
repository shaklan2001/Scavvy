import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/theme";

// Warm cream backdrop with a soft top-glow. Decorative paw prints are kept
// very subtle so the mascot stays the hero.
export function CreamBg({
  children,
  style,
  decorate = true,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  decorate?: boolean;
}) {
  return (
    <View style={[styles.fill, { backgroundColor: colors.cream }, style]}>
      <LinearGradient
        colors={[colors.softCream, colors.cream]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />
      {decorate && (
        <>
          <Ionicons name="paw" size={26} color="#F2E2C4" style={[styles.deco, { top: 90, left: 24, transform: [{ rotate: "-18deg" }] }]} />
          <Ionicons name="paw" size={18} color="#F2E2C4" style={[styles.deco, { top: 150, left: 70, transform: [{ rotate: "8deg" }] }]} />
          <Ionicons name="ellipse" size={10} color="#FBE3B8" style={[styles.deco, { top: 210, right: 40 }]} />
          <Ionicons name="paw" size={22} color="#F2E2C4" style={[styles.deco, { bottom: 120, right: 28, transform: [{ rotate: "22deg" }] }]} />
        </>
      )}
      {children}
    </View>
  );
}

// Warm orange→cream gradient used on the "entering a game" screens.
export function AdventureBg({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.fill, style]}>
      <LinearGradient
        colors={["#FFB25A", "#FF8A00", "#FFF1D6"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      {children}
    </View>
  );
}

// Dark charcoal celebration backdrop for Adventure Complete.
export function DarkBg({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.fill, { backgroundColor: colors.charcoal }, style]}>
      <LinearGradient
        colors={["#2A1E12", colors.charcoal]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  deco: { position: "absolute", opacity: 0.8 },
});
