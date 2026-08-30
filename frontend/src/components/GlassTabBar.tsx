import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, font, radius, shadow } from "@/src/theme";

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap; label: string }> = {
  home: { on: "home", off: "home-outline", label: "Home" },
  adventures: { on: "compass", off: "compass-outline", label: "Adventures" },
  profile: { on: "person", off: "person-outline", label: "Profile" },
};

export const TAB_BAR_HEIGHT = 66;

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 12 }]} pointerEvents="box-none">
      <View style={[styles.bar, shadow.soft]}>
        <BlurView intensity={Platform.OS === "android" ? 40 : 60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.tint} />
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const meta = ICONS[route.name];
            if (!meta) return null;
            const focused = state.index === index;
            const onPress = () => {
              Haptics.selectionAsync().catch(() => {});
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            return (
              <Pressable
                key={route.key}
                testID={`tab-${route.name}`}
                onPress={onPress}
                style={styles.item}
                hitSlop={8}
              >
                <View style={[styles.pill, focused && styles.pillActive]}>
                  <Ionicons
                    name={focused ? meta.on : meta.off}
                    size={22}
                    color={focused ? colors.orange : colors.brownSoft}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: focused ? font.bold : font.semibold,
                    fontSize: 11,
                    marginTop: 2,
                    color: focused ? colors.orange : colors.brownSoft,
                  }}
                >
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,246,230,0.72)",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  item: { alignItems: "center", justifyContent: "center", flex: 1, paddingTop: 4 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  pillActive: {
    backgroundColor: "rgba(255,138,0,0.14)",
  },
});
