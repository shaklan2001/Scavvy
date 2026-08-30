import React, { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, MascotBlob } from "@/src/components/ScavvyMascot";
import { Button, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";

export default function CameraPermission() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveProfile } = useScavvy();
  const [permission, requestPermission] = useCameraPermissions();
  const [blocked, setBlocked] = useState(false);

  const next = async () => {
    await saveProfile({ cameraAsked: true });
    router.push("/onboarding/location-permission");
  };

  const onEnable = async () => {
    if (permission && !permission.canAskAgain && !permission.granted) {
      Linking.openSettings();
      return;
    }
    const res = await requestPermission();
    if (!res.granted && !res.canAskAgain) {
      setBlocked(true);
      return;
    }
    next();
  };

  return (
    <CreamBg>
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.hero}>
          <MascotBlob size={240} color="#FFDFA6" />
          <ScavvyMascot pose="camera" size="xl" anim="breathe" testID="camera-perm-mascot" />
        </View>

        <View style={styles.body}>
          <View style={styles.badge}>
            <Ionicons name="camera" size={18} color={colors.orange} />
            <T weight="bold" size={12} color={colors.orange} style={{ marginLeft: 6 }}>
              CAMERA
            </T>
          </View>
          <T weight="extrabold" size={32} color={colors.charcoal} style={{ marginTop: spacing.md }}>
            Scavvy needs eyes.
          </T>
          <T weight="medium" size={16} color={colors.brown} style={{ marginTop: spacing.md }}>
            Your camera lets Scavvy understand the world around you and create missions that actually fit.
          </T>
          {blocked && (
            <T weight="semibold" size={14} color={colors.red} style={{ marginTop: spacing.md }}>
              Camera is blocked. Open Settings to let Scavvy see.
            </T>
          )}
        </View>

        <Button
          testID="enable-camera-button"
          label={blocked ? "OPEN SETTINGS" : "ENABLE CAMERA"}
          icon="camera"
          onPress={onEnable}
        />
        <View style={{ height: spacing.md }} />
        <Button testID="camera-not-now-button" label="Not now" variant="ghost" onPress={next} />
      </View>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 240 },
  body: { marginBottom: spacing.xl },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.softCream,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
});
