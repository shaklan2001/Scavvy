import React from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, MascotBlob } from "@/src/components/ScavvyMascot";
import { Button, T } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme";

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <CreamBg>
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.hero}>
          <MascotBlob size={280} color="#FFE7BE" />
          <ScavvyMascot pose="curious" size="hero" anim="float" testID="welcome-mascot" />
        </View>

        <View style={styles.body}>
          <T weight="extrabold" size={34} color={colors.charcoal} style={{ lineHeight: 40 }}>
            Your world is{"\n"}hiding something.
          </T>
          <T weight="medium" size={17} color={colors.brown} style={{ marginTop: spacing.md }}>
            Scavvy turns ordinary places into tiny adventures.
          </T>
        </View>

        <View style={styles.actions}>
          <Button
            testID="lets-find-it-button"
            label="LET'S FIND IT"
            icon="paw"
            onPress={() => router.push("/onboarding/look")}
          />
          <View style={{ height: spacing.md }} />
          <Button
            testID="login-button"
            label="Already have an account? Log in"
            variant="ghost"
            onPress={() => router.push("/onboarding/signup")}
          />
        </View>
      </View>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 300 },
  body: { marginBottom: spacing.xl },
  actions: {},
});
