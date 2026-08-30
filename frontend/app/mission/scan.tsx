import React, { useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, View, ActivityIndicator, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, MascotBlob } from "@/src/components/ScavvyMascot";
import { Button, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";
import { queueScanImages } from "@/src/state/pending-scan";

const GUIDE = ["Look around slowly.", "Show me another side.", "Nice. One more.", "Got it!"];

export default function Scan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { location = "Home" } = useLocalSearchParams<{ location: string }>();
  const { setScanImages } = useScavvy();
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView>(null);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const images = useRef<string[]>([]);

  const finish = () => {
    queueScanImages(images.current);
    setScanImages(images.current);
    router.replace({ pathname: "/mission/analyzing-env", params: { location: String(location) } });
  };

  const capture = async () => {
    if (busy || count >= 3) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const photo = await camRef.current?.takePictureAsync({
        quality: 0.22,
        base64: true,
        skipProcessing: false,
        imageType: "jpg",
      });
      if (photo?.base64) images.current.push(`data:image/jpeg;base64,${photo.base64}`);
    } catch (error) {
      if (__DEV__) console.warn("[scavvy] scan capture failed", error instanceof Error ? error.name : "unknown");
    }
    const n = count + 1;
    setCount(n);
    setBusy(false);
    if (n >= 3) setTimeout(finish, 500);
  };

  if (!permission || !permission.granted) {
    const blocked = permission && !permission.canAskAgain;
    return (
      <CreamBg>
        <Pressable testID="scan-back" onPress={() => router.back()} hitSlop={10} style={[styles.gateBack, { top: insets.top + 8 }]}>
          <Ionicons name="chevron-back" size={22} color={colors.charcoal} />
          <T weight="bold" size={15} color={colors.charcoal} style={{ marginLeft: 2 }}>Back</T>
        </Pressable>
        <View style={[styles.gate, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.gateHero}><MascotBlob size={220} color="#FFDFA6" /><ScavvyMascot pose="camera" size="xl" anim="breathe" /></View>
          <T weight="extrabold" size={26} color={colors.charcoal} center>Let Scavvy look around</T>
          <T weight="medium" size={15} color={colors.brown} center style={{ marginTop: 8 }}>Scan the space so Scavvy can hide quests just for you.</T>
          <View style={{ height: spacing.xl }} />
          <Button testID="scan-enable-button" label={blocked ? "OPEN SETTINGS" : "ENABLE CAMERA"} icon="camera" onPress={() => (blocked ? Linking.openSettings() : requestPermission())} />
          {Platform.OS === "web" && (<>
            <View style={{ height: spacing.md }} />
            <Button testID="scan-web-sample-button" label="Use a sample scan" variant="secondary" icon="sparkles" onPress={finish} />
          </>)}
        </View>
      </CreamBg>
    );
  }

  return (
    <View style={styles.root} testID="scan-screen">
      <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing="back" />
      <View style={[styles.scanOverlay, { top: insets.top + 70 }]} />
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable testID="scan-back" onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}><Ionicons name="close" size={24} color="#fff" /></Pressable>
        <View style={styles.pill}><T weight="bold" size={13} color="#fff">SCAN YOUR SPACE · {count} / 3</T></View>
      </View>
      <View style={styles.companion} pointerEvents="none"><ScavvyMascot pose="face_curious" size={64} anim="float" /></View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <T weight="bold" size={17} color="#fff" center style={{ marginBottom: spacing.base }}>{GUIDE[count]}</T>
        <Pressable testID="scan-shutter" onPress={capture} style={styles.shutterOuter}>
          <View style={styles.shutterInner}>{busy ? <ActivityIndicator color={colors.charcoal} /> : <T weight="extrabold" size={18} color={colors.charcoal}>{count + 1}</T>}</View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  gate: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: "center" },
  gateBack: { position: "absolute", left: spacing.base, zIndex: 10, flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingRight: 10 },
  gateHero: { alignItems: "center", justifyContent: "center", height: 220, marginBottom: spacing.lg },
  scanOverlay: { position: "absolute", left: 24, right: 24, bottom: 200, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)", borderRadius: radius.xl, borderStyle: "dashed" },
  top: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.base, gap: spacing.md },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  pill: { backgroundColor: "rgba(0,0,0,0.4)", borderRadius: radius.pill, paddingHorizontal: spacing.base, paddingVertical: 8 },
  companion: { position: "absolute", right: 12, top: "42%" },
  bottom: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center" },
  shutterOuter: { width: 82, height: 82, borderRadius: 41, borderWidth: 5, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
});
