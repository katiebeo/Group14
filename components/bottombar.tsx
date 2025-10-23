import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { Href, usePathname, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../constants/theme";
import { Linking } from "react-native";
export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();

  // Treat /route and /route/* as active
  const isActive = (route: Href) => {
    const r = String(route).replace(/\/+$/, "");
    const p = String(pathname).replace(/\/+$/, "");
    return p === r || p.startsWith(r + "/");
  };

  const iconColor = (route: Href) => (isActive(route) ? "#000" : "#fff");

  const go = (route: Href) => {
    if (!isActive(route)) router.push(route);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.PURPLE }]}>
      {/* Homepage */}
      <Pressable onPress={() => go("/homepage")} style={styles.iconBtn} hitSlop={8}>
        <Ionicons name="home" size={28} color={iconColor("/homepage")} />
      </Pressable>
      {/* Map (center) */}
      <Pressable
        onPress={() => router.push("../../web/autologin")}
        style={styles.centerBtn}
        hitSlop={8}
      >
        <Ionicons
          name="log-in"
          size={28}
          color={isActive("../../web/autologin") ? "#000" : colors.PURPLE}
        />
      </Pressable>

      {/* Alert */}
      <Pressable onPress={() => go("/quickaction/alert")} style={styles.iconBtn} hitSlop={8}>
        <Ionicons name="warning" size={28} color={iconColor("/quickaction/alert")} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconBtn: { padding: 8 },
  centerBtn: {
    backgroundColor: "#fff",
    borderRadius: 40,
    padding: 14,
    marginBottom: 10,
  },
});
