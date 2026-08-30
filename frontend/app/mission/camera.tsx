import React, { useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, MascotBlob } from "@/src/components/ScavvyMascot";
import { Button, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";

export default function MissionCamera() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { index = "0", attempt = "1" } = useLocalSearchParams<{ index: string; attempt: string }>();
  const { adventure } = useScavvy();
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView>(null);
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);

  const idx = parseInt(index, 10) || 0;
  const mission = adventure?.missions[idx];
  const label = `MISSION ${String(idx + 1).padStart(2, "0")}`;

  const goAnalyze = (uri: string | null) => {
    router.push({
      pathname: "/mission/analyzing",
      params: { index: String(idx), attempt: String(attempt), uri: uri || "" },
    });
  };

  const capture = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const photo = await camRef.current?.takePictureAsync({ quality: 0.6, skipProcessing: true });
      goAnalyze(photo?.uri ?? null);
    } catch {
      goAnalyze(null);
    } finally {
      setBusy(false);
    }
  };

  const pickGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 0.6,
      });
      if (!res.canceled && res.assets?.[0]) goAnalyze(res.assets[0].uri);
    } catch {
      goAnalyze(null);
    }
  };

  // ---- Permission gate (pre-explained already in onboarding) ----
  if (!permission || !permission.granted) {
    const blocked = permission && !permission.canAskAgain;
    return (
      <CreamBg>
        <View style={[styles.gate, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.gateHero}>
            <MascotBlob size={220} color="#FFDFA6" />
            <ScavvyMascot pose="camera" size="xl" anim="breathe" />
          </View>
          <T weight="extrabold" size={26} color={colors.charcoal} center>
            Scavvy needs the camera
          </T>
          <T weight="medium" size={15} color={colors.brown} center style={{ marginTop: 8 }}>
            Point it at anything and Scavvy will judge your find (kindly).
          </T>
          <View style={{ height: spacing.xl }} />
          <Button
            testID="camera-grant-button"
            label={blocked ? "OPEN SETTINGS" : "ENABLE CAMERA"}
            icon="camera"
            onPress={() => (blocked ? Linking.openSettings() : requestPermission())}
          />
          <View style={{ height: spacing.md }} />
          <Button
            testID="simulate-find-button"
            label="Use a photo from gallery"
            variant="secondary"
            icon="images"
            onPress={pickGallery}
          />
          {Platform.OS === "web" && (
            <>
              <View style={{ height: spacing.md }} />
              <Button
                testID="web-demo-find-button"
                label="Continue with a sample find"
                variant="ghost"
                icon="sparkles"
                onPress={() => goAnalyze(null)}
              />
            </>
          )}
        </View>
      </CreamBg>
    );
  }

  return (
    <View style={styles.root} testID="camera-screen">
      <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing="back" enableTorch={torch} />

      {/* top mission strip */}
      <View style={[styles.topStrip, { paddingTop: insets.top + 10 }]}>
        <Pressable testID="camera-back" onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.missionInfo}>
          <T weight="bold" size={11} color={colors.yellow} style={{ letterSpacing: 1 }}>
            {label}
          </T>
          <T weight="semibold" size={14} color="#fff" numberOfLines={2}>
            {mission?.title || "Find something interesting."}
          </T>
        </View>
      </View>

      {/* tiny floating Scavvy companion (does not cover the view) */}
      <View style={styles.companion} pointerEvents="none">
        <ScavvyMascot pose="face_curious" size={64} anim="float" />
      </View>

      {/* bottom controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable testID="gallery-button" onPress={pickGallery} style={styles.sideBtn}>
          <Ionicons name="images" size={24} color="#fff" />
        </Pressable>

        <Pressable testID="shutter-button" onPress={capture} style={styles.shutterOuter}>
          <View style={styles.shutterInner}>
            {busy ? <ActivityIndicator color={colors.charcoal} /> : null}
          </View>
        </Pressable>

        <Pressable testID="flash-button" onPress={() => setTorch((t) => !t)} style={styles.sideBtn}>
          <Ionicons name={torch ? "flash" : "flash-off"} size={24} color={torch ? colors.yellow : "#fff"} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  gate: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: "center" },
  gateHero: { alignItems: "center", justifyContent: "center", height: 220, marginBottom: spacing.lg },
  topStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  missionInfo: {
    flex: 1,
    marginLeft: spacing.md,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  companion: { position: "absolute", right: 12, top: "42%" },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: spacing.xxl,
  },
  sideBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
