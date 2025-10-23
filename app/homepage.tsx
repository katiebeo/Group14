import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomBar from "../components/bottombar";
import AppHeader from "../components/header";
import { useTheme } from "../constants/theme";

type Action = {
  key: string;
  label: string;
  Icon: React.ComponentType<any>;
  iconName: string;
  onPress: () => void;
};

export default function QuickActionsScreen() {
  const { colors } = useTheme();
  const s = styles(colors);

  const onAvatarPress = () => router.push("/profile");

  const actions: Action[] = [
    {
      key: "new",
      label: "New Manifest",
      Icon: MaterialIcons,
      iconName: "note-add",
      onPress: () => router.push("/quickaction/create_mani"),
    },
    {
      key: "mine",
      label: "My Manifest",
      Icon: MaterialIcons,
      iconName: "assignment",
      onPress: () => router.push("/quickaction/ma_mani"),
    },
    {
      key: "alert",
      label: "Alert",
      Icon: Ionicons,
      iconName: "warning-outline",
      onPress: () => router.push("/quickaction/alert"),
    },
    {
      key: "map",
      label: "Map",
      Icon: FontAwesome5,
      iconName: "globe-americas",
      onPress: () => router.push("/quickaction/map"),
    },
  ];

  return (
    <SafeAreaView style={s.container}>
      <AppHeader showBack onAvatarPress={onAvatarPress} />

      <Text style={s.title}>Quick Action</Text>

      <View style={s.card}>
        {actions.map((Action, idx) => (
          <TouchableOpacity
            key={Action.key}
            style={[
              s.tile,
              idx < 2 && s.tileBottomBorder,
              idx % 2 === 0 && s.tileRightBorder,
            ]}
            activeOpacity={0.85}
            onPress={Action.onPress}
            accessibilityRole="button"
            accessibilityLabel={Action.label}
          >
            <Action.Icon name={Action.iconName as any} size={34} color={colors.PURPLE} />
            <View style={{ height: 8 }} />
            <Text style={s.tileText}>{Action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
}

const styles = (colors: typeof import("../constants/theme").light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.BACK,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.TEXT,
      marginTop: 100,
      marginBottom: 30,
      alignSelf: "center",
    },
    card: {
      width: "90%",
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: colors.DARK + "33",
      borderRadius: 15,
      overflow: "hidden",
      flexDirection: "row",
      flexWrap: "wrap",
      backgroundColor: colors.LAVENDER,
      alignItems: "center",
      alignSelf: "center",
    },
    tile: {
      width: "50%",
      aspectRatio: 1.35,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.LAVENDER,
    },
    tileBottomBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth * 2,
      borderBottomColor: colors.DARK + "33",
    },
    tileRightBorder: {
      borderRightWidth: StyleSheet.hairlineWidth * 2,
      borderRightColor: colors.DARK + "33",
    },
    tileText: {
      textAlign: "center",
      fontSize: 20,
      lineHeight: 20,
      color: colors.TEXT,
      fontWeight: "600",
      paddingHorizontal: 6,
    },
    bottomBarWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
  });