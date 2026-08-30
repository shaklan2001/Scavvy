import React from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, MascotBlob } from "@/src/components/ScavvyMascot";
import { Button, T } from "@/src/components/ui";
import { colors, radius, shadow, spacing } from "@/src/theme";

function FlowStep({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIcon}>
        <Ionicons name={icon} size={24} color={colors.orange} />
      </View>
      <T weight="semibold" size={12} color={colors.brown} style={{ marginTop: 6 }}>
        {label}
      </T>
    </View>
  );
}

export default function Look() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <CreamBg>
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.hero}>
          <MascotBlob size={260} color="#FFDFA6" />
          <ScavvyMascot pose="detective" size="xl" anim="wiggle" testID="look-mascot" />
        </View>

        <View style={styles.body}>
          <T weight="extrabold" size={34} color={colors.charcoal}>
            Look closer.
          </T>
          <T weight="medium" size={17} color={colors.brown} style={{ marginTop: spacing.md }}>
            Your camera helps Scavvy understand what's around you.
          </T>

          <View style={styles.flow}>
            <FlowStep icon="camera" label="Camera" />
            <Ionicons name="arrow-forward" size={18} color={colors.brownSoft} />
            <FlowStep icon="cube" label="Object" />
            <Ionicons name="arrow-forward" size={18} color={colors.brownSoft} />
            <FlowStep icon="flag" label="Mission" />
          </View>
        </View>

        <Button
          testID="show-me-button"
          label="SHOW ME"
          icon="eye"
          onPress={() => router.push("/onboarding/signup")}
        />
      </View>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 260 },
  body: { marginBottom: spacing.xl },
  flow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginTop: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.line,
    ...shadow.card,
  },
  step: { alignItems: "center", flex: 1 },
  stepIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.softCream,
    alignItems: "center",
    justifyContent: "center",
  },
});
