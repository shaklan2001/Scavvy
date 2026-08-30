import React, { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, MascotBlob } from "@/src/components/ScavvyMascot";
import { Button, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";

export default function LocationPermission() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveProfile } = useScavvy();
  const [blocked, setBlocked] = useState(false);

  const finish = async () => {
    await saveProfile({ locationAsked: true });
    router.replace("/(tabs)/home");
  };

  const onAllow = async () => {
    try {
      const current = await Location.getForegroundPermissionsAsync();
      if (!current.granted && !current.canAskAgain) {
        if (blocked) {
          Linking.openSettings();
          return;
        }
        setBlocked(true);
        return;
      }
      const res = await Location.requestForegroundPermissionsAsync();
      if (!res.granted && !res.canAskAgain) {
        setBlocked(true);
        return;
      }
      finish();
    } catch {
      finish();
    }
  };

  return (
    <CreamBg>
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.hero}>
          <MascotBlob size={240} color="#FFDFA6" />
          <ScavvyMascot pose="map" size="xl" anim="float" testID="location-perm-mascot" />
        </View>

        <View style={styles.body}>
          <View style={styles.badge}>
            <Ionicons name="location" size={18} color={colors.green} />
            <T weight="bold" size={12} color={colors.green} style={{ marginLeft: 6 }}>
              LOCATION
            </T>
          </View>
          <T weight="extrabold" size={32} color={colors.charcoal} style={{ marginTop: spacing.md }}>
            Want bigger adventures?
          </T>
          <T weight="medium" size={16} color={colors.brown} style={{ marginTop: spacing.md }}>
            Location lets Scavvy create missions based on where you explore.
          </T>
          {blocked && (
            <T weight="semibold" size={14} color={colors.red} style={{ marginTop: spacing.md }}>
              Location is blocked. Open Settings to enable it.
            </T>
          )}
        </View>

        <Button
          testID="allow-location-button"
          label={blocked ? "OPEN SETTINGS" : "ALLOW LOCATION"}
          icon="location"
          onPress={onAllow}
        />
        <View style={{ height: spacing.md }} />
        <Button testID="location-maybe-later-button" label="Maybe later" variant="ghost" onPress={finish} />
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
