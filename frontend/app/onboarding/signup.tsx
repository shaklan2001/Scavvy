import React, { useState } from "react";
import { StyleSheet, TextInput, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import { CreamBg } from "@/src/components/Bg";
import { ScavvyMascot, ScavvyPose } from "@/src/components/ScavvyMascot";
import { Button, T } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { colors, font, radius, shadow, spacing } from "@/src/theme";
import { useScavvy } from "@/src/state/ScavvyContext";

type Field = "name" | "email" | "password" | null;

const POSE_BY_FIELD: Record<string, ScavvyPose> = {
  name: "face_happy",
  email: "face_curious",
  password: "sleeping", // covers its eyes
  none: "peek",
};

function InputRow({
  icon,
  value,
  onChangeText,
  placeholder,
  onFocus,
  secure,
  toggleSecure,
  showToggle,
  keyboardType,
  testID,
}: any) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={20} color={colors.brownSoft} />
      <TextInput
        testID={testID}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.brownSoft}
        onFocus={onFocus}
        secureTextEntry={secure}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        keyboardType={keyboardType}
      />
      {showToggle && (
        <Pressable onPress={toggleSecure} hitSlop={10}>
          <Ionicons name={secure ? "eye-off" : "eye"} size={20} color={colors.brownSoft} />
        </Pressable>
      )}
    </View>
  );
}

export default function SignUp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { saveProfile } = useScavvy();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [field, setField] = useState<Field>(null);

  const pose = POSE_BY_FIELD[field ?? "none"];

  const onCreate = async () => {
    if (!name.trim()) {
      toast.show("Scavvy needs a name to call you!", "alert-circle");
      return;
    }
    await saveProfile({ name: name.trim() });
    router.push("/onboarding/personality");
  };

  return (
    <CreamBg decorate={false}>
      <KeyboardAwareScrollView
        bottomOffset={90}
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 140, paddingHorizontal: spacing.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <T weight="extrabold" size={32} color={colors.charcoal}>
          Let's get you in.
        </T>
        <T weight="medium" size={17} color={colors.brown} style={{ marginTop: 6, marginBottom: spacing.xl }}>
          Your adventures need a name.
        </T>

        <View style={styles.peekWrap} pointerEvents="none">
          <ScavvyMascot pose={pose} size={128} anim={field === "password" ? "none" : "breathe"} />
        </View>

        <View style={styles.card} testID="signup-card">
          <InputRow
            testID="name-input"
            icon="person"
            value={name}
            onChangeText={setName}
            placeholder="Name"
            onFocus={() => setField("name")}
            keyboardType="default"
          />
          <View style={styles.divider} />
          <InputRow
            testID="email-input"
            icon="mail"
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            onFocus={() => setField("email")}
            keyboardType="email-address"
          />
          <View style={styles.divider} />
          <InputRow
            testID="password-input"
            icon="lock-closed"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            onFocus={() => setField("password")}
            secure={secure}
            showToggle
            toggleSecure={() => setSecure((s) => !s)}
            keyboardType="default"
          />
        </View>

        <View style={{ height: spacing.xl }} />
        <Button testID="create-account-button" label="CREATE ACCOUNT" icon="paw" onPress={onCreate} />
        <View style={{ height: spacing.md }} />
        <Button
          testID="google-button"
          label="Continue with Google"
          variant="secondary"
          icon="logo-google"
          onPress={() => toast.show("Google sign-in coming soon ✨", "logo-google")}
        />
        <T weight="regular" size={12} color={colors.brownSoft} center style={{ marginTop: spacing.lg }}>
          By continuing, you agree to our Terms & Privacy Policy.
        </T>
      </KeyboardAwareScrollView>
    </CreamBg>
  );
}

const styles = StyleSheet.create({
  peekWrap: { alignItems: "center", marginBottom: -18, zIndex: 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.line,
    ...shadow.card,
  },
  inputRow: { flexDirection: "row", alignItems: "center", height: 58 },
  input: {
    flex: 1,
    marginLeft: spacing.md,
    fontFamily: font.medium,
    fontSize: 16,
    color: colors.charcoal,
  },
  divider: { height: 1, backgroundColor: colors.line },
});
