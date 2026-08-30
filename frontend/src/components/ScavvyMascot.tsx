import React, { useEffect, useRef } from "react";
import { Animated, Easing, ImageStyle, StyleProp, View } from "react-native";
import { Image } from "expo-image";

// All poses are transparent character cut-outs derived from the supplied
// Scavvy artwork. Missing poses fall back to the closest available one so the
// character stays visually consistent everywhere.
const POSES = {
  welcome: require("../../assets/mascot/welcome.png"),
  idle: require("../../assets/mascot/idle.png"),
  thinking: require("../../assets/mascot/thinking.png"),
  curious: require("../../assets/mascot/curious.png"),
  excited: require("../../assets/mascot/excited.png"),
  success: require("../../assets/mascot/success.png"),
  confused: require("../../assets/mascot/confused.png"),
  sad: require("../../assets/mascot/confused.png"),
  sleeping: require("../../assets/mascot/sleeping.png"),
  celebrating: require("../../assets/mascot/celebrating.png"),
  detective: require("../../assets/mascot/detective.png"),
  exploring: require("../../assets/mascot/exploring.png"),
  camera: require("../../assets/mascot/camera.png"),
  map: require("../../assets/mascot/map.png"),
  running: require("../../assets/mascot/running.png"),
  peek: require("../../assets/mascot/peek.png"),
  // faces
  face_happy: require("../../assets/mascot/face_happy.png"),
  face_wink: require("../../assets/mascot/face_wink.png"),
  face_excited: require("../../assets/mascot/face_excited.png"),
  face_thinking: require("../../assets/mascot/face_thinking.png"),
  face_sad: require("../../assets/mascot/face_sad.png"),
  face_love: require("../../assets/mascot/face_love.png"),
  face_surprised: require("../../assets/mascot/face_surprised.png"),
  face_curious: require("../../assets/mascot/face_curious.png"),
} as const;

export type ScavvyPose = keyof typeof POSES;

const SIZE_MAP: Record<string, number> = {
  xs: 56,
  sm: 88,
  md: 140,
  lg: 200,
  xl: 260,
  hero: 320,
};

export type Anim = "none" | "breathe" | "float" | "bounce" | "wiggle";

type Props = {
  pose: ScavvyPose;
  size?: number | keyof typeof SIZE_MAP;
  anim?: Anim;
  style?: StyleProp<ImageStyle>;
  flip?: boolean;
};

export function ScavvyMascot({ pose, size = "md", anim = "breathe", style, flip }: Props) {
  const px = typeof size === "number" ? size : SIZE_MAP[size] ?? 140;
  const src = POSES[pose] ?? POSES.idle;

  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    v.setValue(0);
    if (anim === "none") return;
    let animation: Animated.CompositeAnimation;
    if (anim === "bounce") {
      animation = Animated.sequence([
        Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 4, tension: 120 }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(v, { toValue: 0.7, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ])
        ),
      ]);
    } else {
      const dur = anim === "wiggle" ? 1400 : anim === "float" ? 2600 : 2200;
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    }
    animation.start();
    return () => animation.stop();
  }, [anim, v]);

  const transform: any[] = [];
  if (flip) transform.push({ scaleX: -1 });
  if (anim === "breathe") {
    transform.push({ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) });
  } else if (anim === "float") {
    transform.push({ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) });
  } else if (anim === "wiggle") {
    transform.push({ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["-4deg", "4deg"] }) });
  } else if (anim === "bounce") {
    transform.push({ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, -14] }) });
  }

  return (
    <Animated.View style={{ transform }}>
      <Image
        source={src}
        style={[{ width: px, height: px }, style]}
        contentFit="contain"
        transition={200}
      />
    </Animated.View>
  );
}

// Small standalone prop images (magnifier / map / backpack / camera / cap).
const PROP_IMAGES = {
  magnifier: require("../../assets/mascot/icon_magnifier.png"),
  map: require("../../assets/mascot/icon_map.png"),
  backpack: require("../../assets/mascot/icon_backpack.png"),
  binoculars: require("../../assets/mascot/icon_binoculars.png"),
  camera: require("../../assets/mascot/icon_camera.png"),
  cap: require("../../assets/mascot/icon_cap.png"),
} as const;

export function ScavvyProp({
  name,
  size = 40,
  style,
}: {
  name: keyof typeof PROP_IMAGES;
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={PROP_IMAGES[name]}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
    />
  );
}

export const ScavvyLogo = ({ width = 220, style }: { width?: number; style?: StyleProp<ImageStyle> }) => (
  <Image
    source={require("../../assets/mascot/logo.png")}
    style={[{ width, height: width * 0.6 }, style]}
    contentFit="contain"
  />
);

export function MascotBlob({ size = 220, color = "#FFE7BE" }: { size?: number; color?: string }) {
  // Soft circular halo placed behind the mascot for depth on plain surfaces.
  return (
    <View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.6,
      }}
    />
  );
}
