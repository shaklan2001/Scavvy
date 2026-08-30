import React from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot } from "@/src/components/ScavvyMascot";
import { Button, Card, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";

const TYPE_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  observation: { icon: "eye", label: "OBSERVATION" },
  reasoning: { icon: "bulb", label: "BRAIN QUEST" },
  visual: { icon: "color-wand", label: "VISUAL CLUE" },
};

export default function Quests() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { adventure, selectQuest, resetAdventure } = useScavvy();

  if (!adventure) {
    router.replace("/(tabs)/home");
    return null;
  }

  const missions = adventure.missions as any[];
  const remaining = missions.filter((m) => m.status !== "done").length;

  const play = (index: number) => {
    selectQuest(index);
    router.push("/mission/reveal");
  };

  return (
    <CreamBg decorate={false}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable testID="quests-back" onPress={() => { resetAdventure(); router.replace("/(tabs)/home"); }} hitSlop={10} style={styles.back}>
          <Ionicons name="close" size={24} color={colors.charcoal} />
        </Pressable>
        <View style={styles.headRow}>
          <ScavvyMascot pose="excited" size={90} anim="wiggle" />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <T weight="extrabold" size={24} color={colors.charcoal}>Scavvy found {missions.length} sidequests.</T>
            <T weight="medium" size={14} color={colors.brown} style={{ marginTop: 4 }}>Pick where to start.</T>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {missions.map((m, i) => {
          const meta = TYPE_META[m.type] || TYPE_META.observation;
          const done = m.status === "done";
          return (
            <Pressable key={i} testID={`quest-card-${i}`} disabled={done} onPress={() => play(i)}>
              <Card style={[styles.card, done && styles.cardDone]}>
                <View style={[styles.iconBox, done && { backgroundColor: colors.green }]}>
                  <Ionicons name={done ? "checkmark" : meta.icon} size={24} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.base }}>
                  <T weight="bold" size={12} color={done ? colors.green : colors.orange} style={{ letterSpacing: 0.5 }}>
                    {done ? "COMPLETE" : meta.label}
                  </T>
                  <T weight="extrabold" size={16} color={colors.charcoal} numberOfLines={2} style={{ marginTop: 2 }}>{m.title}</T>
                  <T weight="semibold" size={12} color={colors.brown} style={{ marginTop: 4 }}>{m.difficulty} · +{m.xp} XP</T>
                </View>
                {!done && <Ionicons name="chevron-forward" size={22} color={colors.brownSoft} />}
              </Card>
            </Pressable>
          );
        })}

        {remaining === 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <Button testID="quests-results-button" label="SEE MY RESULTS" icon="trophy" onPress={() => router.replace("/adventure-complete")} />
          </View>
        )}
      </ScrollView>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  back: { position: "absolute", right: spacing.base, top: 0, marginTop: 0, padding: spacing.sm, zIndex: 5 },
  headRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xl },
  card: { flexDirection: "row", alignItems: "center", marginBottom: spacing.base, padding: spacing.base },
  cardDone: { backgroundColor: colors.softCream, borderColor: colors.line },
  iconBox: { width: 50, height: 50, borderRadius: radius.md, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
});
