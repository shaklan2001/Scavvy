import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius, shadow, spacing } from "@/src/theme";

// ---------------------------------------------------------------- Text
export function T({
  children,
  style,
  weight = "regular",
  size = 15,
  color = colors.charcoal,
  center,
  numberOfLines,
  testID,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  weight?: keyof typeof font;
  size?: number;
  color?: string;
  center?: boolean;
  numberOfLines?: number;
  testID?: string;
}) {
  return (
    <Text
      testID={testID}
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: font[weight], fontSize: size, color, lineHeight: size * 1.3 },
        center && { textAlign: "center" },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------- Button
type BtnProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  testID,
  style,
  disabled,
  fullWidth = true,
}: BtnProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, friction: 6, tension: 200 }).start();

  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { alignSelf: "stretch" }, style]}>
      <Pressable
        testID={testID}
        disabled={disabled}
        onPressIn={() => to(0.96)}
        onPressOut={() => to(1)}
        onPress={() => {
          if (disabled) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          onPress();
        }}
        style={[
          styles.btn,
          isPrimary && styles.btnPrimary,
          isPrimary && shadow.button,
          isSecondary && styles.btnSecondary,
          variant === "ghost" && styles.btnGhost,
          disabled && { opacity: 0.5 },
        ]}
      >
        <View style={styles.btnRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={isPrimary ? "#fff" : colors.charcoal}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              styles.btnText,
              { color: isPrimary ? "#fff" : colors.charcoal },
            ]}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------- Card
export function Card({
  children,
  style,
  onPress,
  testID,
  selected,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
  selected?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const content = (
    <View style={[styles.card, selected && styles.cardSelected, style]}>{children}</View>
  );
  if (!onPress) return content;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        testID={testID}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start()
        }
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------- Speech bubble
export function SpeechBubble({
  text,
  style,
  testID,
  tailSide = "left",
}: {
  text: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  tailSide?: "left" | "right" | "none";
}) {
  return (
    <View testID={testID} style={[styles.bubble, style]}>
      <T weight="semibold" size={14} color={colors.charcoal}>
        {text}
      </T>
      {tailSide !== "none" && (
        <View
          style={[
            styles.bubbleTail,
            tailSide === "left" ? { left: 22 } : { right: 22 },
          ]}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------- Stat pill
export function StatPill({
  icon,
  value,
  label,
  color = colors.orange,
}: {
  icon: string;
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <T weight="extrabold" size={20} color={colors.charcoal} style={{ marginTop: 2 }}>
        {value}
      </T>
      <T weight="medium" size={11} color={colors.brown}>
        {label}
      </T>
    </View>
  );
}

// ---------------------------------------------------------------- Progress bar
export function TraitBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <T weight="semibold" size={13} color="#F4E9D5">
          {label}
        </T>
        <T weight="bold" size={13} color={color}>
          {value}%
        </T>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Paw trail
export function PawTrail({
  count = 5,
  color = colors.orange,
  vertical = false,
}: {
  count?: number;
  color?: string;
  vertical?: boolean;
}) {
  const anims = useRef([...Array(count)].map(() => new Animated.Value(0))).current;
  React.useEffect(() => {
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 220),
          Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.25, duration: 500, useNativeDriver: true }),
          Animated.delay((count - i) * 160),
        ])
      )
    );
    Animated.stagger(120, loops).start();
  }, [anims, count]);
  return (
    <View style={{ flexDirection: vertical ? "column" : "row", alignItems: "center", gap: 10 }}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{
            opacity: a,
            transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
          }}
        >
          <Ionicons name="paw" size={18} color={color} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 58,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  btnPrimary: { backgroundColor: colors.orange },
  btnSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  btnGhost: { backgroundColor: "transparent", height: 44 },
  btnRow: { flexDirection: "row", alignItems: "center" },
  btnText: { fontFamily: font.bold, fontSize: 16, letterSpacing: 0.4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    ...shadow.card,
  },
  cardSelected: {
    borderColor: colors.orange,
    borderWidth: 2.5,
    ...shadow.soft,
  },
  bubble: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    ...shadow.card,
    alignSelf: "flex-start",
  },
  bubbleTail: {
    position: "absolute",
    bottom: -7,
    width: 16,
    height: 16,
    backgroundColor: colors.card,
    transform: [{ rotate: "45deg" }],
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  },
  fill: { height: 10, borderRadius: 5 },
});
