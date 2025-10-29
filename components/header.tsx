import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../constants/theme";
import { useAlerts } from "../context/AlertContext";


type AppHeaderProps = {
  onAvatarPress: () => void;
  showBack?: boolean;
  title?: string;
};

export default function AppHeader({ onAvatarPress, showBack = false, title }: AppHeaderProps) {
  const { colors } = useTheme();
  const s = styles(colors);
  const [showNotifications, setShowNotifications] = useState(false);
  const { alerts } = useAlerts();

  const activeAlerts = alerts.filter((a) => a.status === "Active");
  const hasNew = activeAlerts.length > 0;

  return (
    <>
      {showNotifications && (
        <Pressable style={s.backdrop} onPress={() => setShowNotifications(false)} />
      )}

      <View style={s.header}>
        <View style={s.leftSection}>

          <Image source={require("../assets/images/logo_bina.png")} style={s.logo} resizeMode="contain" />
          {title && <Text style={[s.title, { color: colors.TEXT }]}>{title}</Text>}
        </View>

        <View style={s.topActions}>
          <TouchableOpacity onPress={() => router.push("/scanner")} style={s.iconBtn} hitSlop={8}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color={colors.PURPLE} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowNotifications((v) => !v)} style={s.iconBtn} hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={colors.PURPLE} />
            {hasNew && (
              <View style={s.badgeCount}>
                <Text style={s.badgeText}>{activeAlerts.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <Pressable
            onPress={onAvatarPress}
            style={({ pressed }) => [s.avatarBtn, pressed && s.avatarPressed]}
            hitSlop={10}
          >
            <Ionicons name="person" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      {showNotifications && (
        <View pointerEvents="box-none" style={s.popoverWrap}>
          <View style={[s.popoverCaret, { borderBottomColor: colors.CARD }]} />
          <View style={[s.popoverBox, { backgroundColor: colors.CARD }]}>
            {activeAlerts.length === 0 ? (
              <Text style={[s.noNotif, { color: colors.TEXT }]}>No Notifications</Text>
            ) : (
              activeAlerts.map((n, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    setShowNotifications(false);
                    router.push("/quickaction/alert");
                  }}
                  style={s.notifItem}
                >
                  <Text style={[s.notifText, { color: colors.TEXT }]}>{n.title}</Text>
                </Pressable>
              ))
            )}
          </View>
        </View>
      )}
    </>
  );
}

const styles = (C: typeof import("../constants/theme").light) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 5,
      paddingHorizontal: 12,
      paddingTop: 12,
    },
    leftSection: {
      flexDirection: "row",
      alignItems: "center",
    },

    logo: { width: 140, height: 40 },
    title: {
      fontSize: 18,
      fontWeight: "700",
      marginLeft: 8,
    },
    topActions: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconBtn: { padding: 6, borderRadius: 16, position: "relative" },
    badgeCount: {
      position: "absolute",
      top: 0,
      right: 0,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: "#E21B3C",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
    avatarBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: C.PURPLE,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        },
        android: { elevation: 3 },
      }),
    },
    avatarPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    popoverWrap: { position: "absolute", right: 45, top: 90, zIndex: 20, alignItems: "flex-end" },
    popoverCaret: {
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderBottomWidth: 8,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      marginRight: 34,
    },
    popoverBox: {
      minWidth: 240,
      maxWidth: 320,
      borderRadius: 10,
      paddingVertical: 10,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        },
        android: { elevation: 6 },
      }),
    },
    noNotif: {
      textAlign: "center",
      paddingVertical: 14,
    },
    notifItem: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.MUTED,
    },
    notifText: {},
    backdrop: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 10,
    },
  });
  //BEO