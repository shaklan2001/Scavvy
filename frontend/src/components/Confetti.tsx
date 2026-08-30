import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { colors } from "@/src/theme";

const { width, height } = Dimensions.get("window");
const COLORS = [colors.orange, colors.yellow, colors.green, "#FF6B6B", "#FFD166", "#fff"];

function Piece({ delay, x }: { delay: number; x: number }) {
  const v = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const drift = (Math.random() - 0.5) * 120;
  const size = 8 + Math.random() * 8;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(v, { toValue: 1, duration: 2600 + Math.random() * 1200, useNativeDriver: true }),
          Animated.timing(rot, { toValue: 1, duration: 2600, useNativeDriver: true }),
        ]),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: -20,
        width: size,
        height: size * 1.4,
        borderRadius: 2,
        backgroundColor: color,
        opacity: v.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.9] }) },
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) },
          { rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "540deg"] }) },
        ],
      }}
    />
  );
}

export function Confetti({ count = 34 }: { count?: number }) {
  const pieces = useRef(
    [...Array(count)].map((_, i) => ({ delay: Math.random() * 1200, x: Math.random() * width, key: i }))
  ).current;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <Piece key={p.key} delay={p.delay} x={p.x} />
      ))}
    </View>
  );
}
