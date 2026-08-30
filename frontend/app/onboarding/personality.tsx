import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, ScavvyPose } from "@/src/components/ScavvyMascot";
import { Button, Card, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { PERSONALITIES } from "@/src/data/content";
import { useScavvy } from "@/src/state/ScavvyContext";

const POSE: Record<string, ScavvyPose> = {
  detective: "detective",
  explorer: "exploring",
  creative: "curious",
  chaos: "excited",
};

export default function Personality() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveProfile } = useScavvy();
  const [selected, setSelected] = useState<string>("detective");

  return (
    <CreamBg>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <T weight="extrabold" size={30} color={colors.charcoal}>
              How do you{"\n"}adventure?
            </T>
            <T weight="medium" size={15} color={colors.brown} style={{ marginTop: 8 }}>
              Scavvy uses this to make better missions for you.
            </T>
          </View>
          <ScavvyMascot pose={POSE[selected]} size={104} anim="breathe" />
        </View>

        <View style={styles.grid}>
          {PERSONALITIES.map((p) => {
            const isSel = selected === p.key;
            return (
              <View key={p.key} style={styles.cellWrap}>
                <Card
                  testID={`personality-${p.key}`}
                  selected={isSel}
                  onPress={() => setSelected(p.key)}
                  style={styles.cell}
                >
                  <View style={[styles.iconBox, isSel && { backgroundColor: colors.orange }]}>
                    <Ionicons name={p.icon as any} size={22} color={isSel ? "#fff" : colors.orange} />
                  </View>
                  <T weight="extrabold" size={14} color={isSel ? colors.orange : colors.charcoal} style={{ marginTop: spacing.md }}>
                    {p.title}
                  </T>
                  <T weight="medium" size={12} color={colors.brown} style={{ marginTop: 4 }}>
                    {p.tagline}
                  </T>
                </Card>
              </View>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <Button
          testID="thats-me-button"
          label="THAT'S ME"
          icon="checkmark-circle"
          onPress={async () => {
            await saveProfile({ personality: selected });
            router.push("/onboarding/style");
          }}
        />
      </View>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  head: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  cellWrap: { width: "48%", marginBottom: spacing.base },
  cell: { minHeight: 148 },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.softCream,
    alignItems: "center",
    justifyContent: "center",
  },
});
