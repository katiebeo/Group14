import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

export const light = {
  BACK: "#FFFFFF",
  TEXT: "#111111",
  PURPLE: "#7B3FA2",
  LAVENDER: "#EEE7F4",
  DARK: "#3F3F46",
  CARD: "#EDE6F2",
  INPUT: "#F5EFF8",
  MUTED: "#D8CFE3",
  PLACEHOLDER: "#111111", // black in light mode
};

export const dark = {
  BACK: "#0E0E11",
  TEXT: "#F7F7F8",
  PURPLE: "#9F69C4",
  LAVENDER: "#1A141F",
  DARK: "#E7E7EA",
  CARD: "#14121A",
  INPUT: "#231C2C",
  MUTED: "#2B2633",
  PLACEHOLDER: "#FFFFFF", // white in dark mode
};


type ThemeName = "system" | "light" | "dark";
type Colors = typeof light;

type ThemeCtx = {
  mode: ThemeName;
  isDark: boolean;
  colors: Colors;
  setMode: (m: ThemeName) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeCtx>({
  mode: "system",
  isDark: false,
  colors: light,
  setMode: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "@theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setMode] = useState<ThemeName>("system");

  // load saved choice
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") setMode(saved);
    })();
  }, []);

  // persist choice
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  }, [mode]);

  const effective: "light" | "dark" = mode === "system" ? (system ?? "light") : mode;
  const colors = effective === "dark" ? dark : light;
  const isDark = effective === "dark";

  const value = useMemo(
    () => ({
      mode,
      isDark,
      colors,
      setMode,
      toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")),
    }),
    [mode, isDark, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Legacy export so old code that imports COLORS still compiles (light by default)
export const COLORS = light;
