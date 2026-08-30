import { Stack, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot } from "@/src/components/ScavvyMascot";
import { Button, T } from "@/src/components/ui";
import { colors } from "@/src/theme";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CreamBg>
        <View style={styles.wrap}>
          <ScavvyMascot pose="confused" size={180} anim="float" />
          <T weight="extrabold" size={28} color={colors.charcoal} style={styles.title}>
            Lost the trail
          </T>
          <T size={16} color={colors.brown} style={styles.copy}>
            This path doesn’t exist. Scavvy will take you home.
          </T>
          <Button label="BACK HOME" onPress={() => router.replace("/(tabs)/home")} />
        </View>
      </CreamBg>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 16,
  },
  title: { textAlign: "center", marginTop: 8 },
  copy: { textAlign: "center", marginBottom: 8 },
});
