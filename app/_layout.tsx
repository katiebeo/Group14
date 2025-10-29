import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ThemeProvider, useTheme } from "../constants/theme";
import { AlertProvider } from "../context/AlertContext";

function AppStack() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <AppStack />
      </AlertProvider>
    </ThemeProvider>
  );
}