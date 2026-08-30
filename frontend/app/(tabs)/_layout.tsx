import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { NativeTabs, Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs";
import { colors } from "@/src/theme";

// Native system tab bar (iOS: Liquid Glass on iOS 26, native blur on 18+;
// Android: Material). Web uses the custom glass bar in _layout.web.tsx.
export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={colors.orange}
      iconColor={colors.brown}
      backgroundColor={colors.softCream}
      blurEffect="systemChromeMaterialLight"
      indicatorColor="rgba(255,138,0,0.16)"
      labelStyle={{ color: colors.brown }}
    >
      <NativeTabs.Trigger name="home">
        <Label>Home</Label>
        <Icon sf={{ default: "house", selected: "house.fill" }} androidSrc={<VectorIcon family={Ionicons} name="home" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="adventures">
        <Label>Adventures</Label>
        <Icon sf={{ default: "safari", selected: "safari.fill" }} androidSrc={<VectorIcon family={Ionicons} name="compass" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} androidSrc={<VectorIcon family={Ionicons} name="person" />} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
