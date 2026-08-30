import React from "react";
import { Tabs } from "expo-router";
import { GlassTabBar } from "@/src/components/GlassTabBar";

// Web fallback: native system tabs have no real web equivalent, so we keep the
// custom floating glassmorphism bar here for a polished web preview.
export default function TabsLayoutWeb() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="adventures" options={{ title: "Adventures" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
