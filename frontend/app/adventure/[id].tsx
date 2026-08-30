import React from "react";
import { ScrollView, Share, StyleSheet, View, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot } from "@/src/components/ScavvyMascot";
import { Button, Card, T } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";
import { adventureById } from "@/src/data/demo";
import { useScavvy } from "@/src/state/ScavvyContext";

export default function AdventureDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resetAdventure, startAdventure } = useScavvy();
  const adv = adventureById(String(id));

  const back = () => router.replace("/(tabs)/adventures");

  if (!adv) {
    return (
      <CreamBg>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <T weight="bold" size={18} color={colors.charcoal}>Adventure not found.</T>
          <View style={{ height: spacing.lg }} />
          <Button label="BACK TO ADVENTURES" icon="arrow-back" onPress={back} />
        </View>
      </CreamBg>
    );
  }

  const playAgain = async () => {
    resetAdventure();
    await startAdventure();
    router.replace("/mission/reveal");
  };

  return (
    <CreamBg decorate={false}>
      <Pressable testID="detail-back" onPress={back} style={[styles.back, { top: insets.top + 8 }]} hitSlop={10}>
        <Ionicons name="chevron-back" size={22} color={colors.charcoal} />
        <T weight="bold" size={15} color={colors.charcoal} style={{ marginLeft: 2 }}>Adventures</T>
      </Pressable>

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24, paddingHorizontal: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginBottom: spacing.md }}>
          <ScavvyMascot pose="detective" size={130} anim="float" />
        </View>
        <T weight="bold" size={11} color={colors.brownSoft} style={{ letterSpacing: 0.5 }}>{adv.when}</T>
        <T weight="extrabold" size={28} color={colors.charcoal} style={{ marginTop: 2 }}>{adv.title}</T>
        <T weight="medium" size={15} color={colors.brown} style={{ marginTop: 6 }}>{adv.summary}</T>

        <View style={styles.statsRow}>
          <View style={styles.statBox}><T weight="extrabold" size={18} color={colors.charcoal}>{adv.missionsCount}</T><T weight="medium" size={11} color={colors.brown}>missions</T></View>
          <View style={styles.statBox}><T weight="extrabold" size={18} color={colors.orange}>{adv.xp}</T><T weight="medium" size={11} color={colors.brown}>XP</T></View>
          <View style={styles.statBox}><T weight="extrabold" size={18} color={colors.charcoal}>{adv.minutes}</T><T weight="medium" size={11} color={colors.brown}>minutes</T></View>
        </View>

        <T weight="bold" size={13} color={colors.brown} style={{ marginTop: spacing.xl, marginBottom: spacing.md, letterSpacing: 0.5 }}>MISSIONS</T>
        {adv.missions.map((m) => (
          <Card key={m.n} style={styles.missionCard}>
            <View style={styles.missionHead}>
              <View style={styles.missionNum}><T weight="extrabold" size={13} color="#fff">{String(m.n).padStart(2, "0")}</T></View>
              <T weight="bold" size={15} color={colors.charcoal} style={{ flex: 1, marginLeft: spacing.md }}>{m.prompt}</T>
            </View>
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image" size={34} color={colors.brownSoft} />
            </View>
            <View style={styles.reactionRow}>
              <Ionicons name="chatbubble-ellipses" size={16} color={colors.orange} />
              <T weight="medium" size={13} color={colors.charcoalSoft} style={{ flex: 1, marginLeft: 8, fontStyle: "italic" }}>{m.reaction}</T>
              <View style={styles.xpTag}><Ionicons name="star" size={12} color="#fff" /><T weight="bold" size={12} color="#fff" style={{ marginLeft: 3 }}>+{m.xp}</T></View>
            </View>
          </Card>
        ))}

        <View style={{ height: spacing.lg }} />
        <Button testID="play-again-button" label="PLAY AGAIN" icon="refresh" onPress={playAgain} />
        <View style={{ height: spacing.md }} />
        <Button testID="share-adventure-button" label="SHARE ADVENTURE" variant="secondary" icon="share-social" onPress={() => Share.share({ message: `My Scavvy adventure "${adv.title}" — ${adv.missionsCount} missions, ${adv.xp} XP. ${adv.summary}` }).catch(() => {})} />
        <View style={{ height: spacing.md }} />
        <Button testID="back-adventures-button" label="BACK TO ADVENTURES" variant="ghost" icon="arrow-back" onPress={back} />
      </ScrollView>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  back: { position: "absolute", left: spacing.base, zIndex: 10, flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingRight: 10 },
  statsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  statBox: { flex: 1, alignItems: "center", backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: spacing.base, borderWidth: 1.5, borderColor: colors.line, gap: 2 },
  missionCard: { marginBottom: spacing.md, padding: spacing.base },
  missionHead: { flexDirection: "row", alignItems: "center" },
  missionNum: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  photoPlaceholder: { height: 120, borderRadius: radius.md, backgroundColor: colors.softCream, alignItems: "center", justifyContent: "center", marginTop: spacing.md },
  reactionRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.md },
  xpTag: { flexDirection: "row", alignItems: "center", backgroundColor: colors.orange, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, marginLeft: spacing.sm },
});
