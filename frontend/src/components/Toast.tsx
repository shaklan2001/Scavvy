import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius, shadow } from "@/src/theme";

type ToastCtx = { show: (msg: string, icon?: keyof typeof Ionicons.glyphMap) => void };
const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string>("");
  const [icon, setIcon] = useState<keyof typeof Ionicons.glyphMap>("paw");
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timer = useRef<any>(null);

  const show = useCallback(
    (m: string, ic: keyof typeof Ionicons.glyphMap = "paw") => {
      setMsg(m);
      setIcon(ic);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
      ]).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 20, duration: 220, useNativeDriver: true }),
        ]).start();
      }, 2200);
    },
    [opacity, translateY]
  );

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[styles.wrap, { opacity, transform: [{ translateY }] }]}
      >
        <View style={styles.toast}>
          <Ionicons name={icon} size={18} color={colors.orange} style={{ marginRight: 8 }} />
          <Animated.Text style={styles.text}>{msg}</Animated.Text>
        </View>
      </Animated.View>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) return { show: () => {} };
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 110,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.charcoal,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    maxWidth: "88%",
    ...shadow.soft,
  },
  text: { color: "#FFF6E6", fontFamily: font.semibold, fontSize: 14 },
});
