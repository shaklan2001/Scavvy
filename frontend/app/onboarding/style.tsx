import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot } from "@/src/components/ScavvyMascot";
import { Button, Card, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { STYLES } from "@/src/data/content";
import { useScavvy } from "@/src/state/ScavvyContext";

export default function StyleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveProfile } = useScavvy();
  const [selected, setSelected] = useState<string>("RANDOM");

  return (
    <CreamBg>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <T weight="extrabold" size={30} color={colors.charcoal}>
              What kind of{"\n"}trouble?
            </T>
            <T weight="medium" size={15} color={colors.brown} style={{ marginTop: 8 }}>
              Pick a vibe. Scavvy handles the rest.
            </T>
          </View>
          <ScavvyMascot pose="curious" size={100} anim="wiggle" />
        </View>

        <View style={styles.list}>
          {STYLES.map((s) => {
            const isSel = selected === s.key;
            return (
              <Card
                key={s.key}
                testID={`style-${s.key}`}
                selected={isSel}
                onPress={() => setSelected(s.key)}
                style={styles.row}
              >
                <View style={[styles.iconBox, { backgroundColor: isSel ? s.color : colors.softCream }]}>
                  <Ionicons name={s.icon as any} size={24} color={isSel ? "#fff" : s.color} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.base }}>
                  <T weight="extrabold" size={16} color={isSel ? colors.orange : colors.charcoal}>
                    {s.title}
                  </T>
                  <T weight="medium" size={13} color={colors.brown} style={{ marginTop: 2 }}>
                    {s.desc}
                  </T>
                </View>
                {isSel && <Ionicons name="checkmark-circle" size={24} color={colors.orange} />}
              </Card>
            );
          })}
        </View>

        <Button
          testID="surprise-me-button"
          label="SCAVVY, SURPRISE ME"
          icon="sparkles"
          onPress={async () => {
            await saveProfile({ style: selected });
            router.push("/onboarding/camera-permission");
          }}
        />
      </View>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  head: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  list: { flex: 1, justifyContent: "center", gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.base },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
