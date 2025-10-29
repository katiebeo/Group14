import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../constants/theme";

export default function BackArrow({ label }: { label?: string }) {
  const { colors } = useTheme();
  const s = styles(colors);

  return (
    <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
      <Ionicons name="chevron-back" size={20} color={colors.TEXT} />
      {label && <Text style={{ color: colors.TEXT, fontWeight: "600" }}>{label}</Text>}
    </Pressable>
  );
}

const styles = (C: typeof import("../constants/theme").light) =>
  StyleSheet.create({
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: C.CARD,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      alignSelf: "flex-start",
      marginRight: 12,
      marginLeft: 2,
    },
  });