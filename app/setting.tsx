import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomBar from "../components/bottombar";
import { useTheme } from "../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountSettings() {
  const { colors } = useTheme();
  const s = styles(colors);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [org, setOrg] = useState("");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [twoFA, setTwoFA] = useState(false);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const orgId = await AsyncStorage.getItem("organisationId");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !orgId || !userId) throw new Error("Missing credentials");

      const url = `https://stagingapi.binarytech.io/api/editaccount?organisationId=${orgId.trim()}&id=${userId.trim()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const raw = await res.text();
      if (!raw || raw.trim() === "") throw new Error("Empty response from profile endpoint");

      const result = JSON.parse(raw);

      setFullName(result.fullName ?? "");
      setEmail(result.email ?? "");
      setPhone(result.phoneNumber ?? "");
      setOrg(result.organisationName ?? "");
      setUnit(result.imperial ? "imperial" : "metric");
      setTwoFA(result.twoFactor ?? false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to load profile.");
    }
  };

  const saveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const orgId = await AsyncStorage.getItem("organisationId");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !orgId || !userId) throw new Error("Missing credentials");

      const payload = {
        organisationId: orgId.trim(),
        id: userId.trim(),
        email,
        fullName,
        organisationName: org,
        phoneNumber: phone,
        imperial: unit === "imperial",
        twoFactor: twoFA,
      };

      const res = await fetch("https://stagingapi.binarytech.io/api/editaccount", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Failed to save profile");

      Alert.alert("Success", "Profile updated successfully.");
      router.replace("/profile?refresh=" + Date.now());
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to save profile.");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.BACK }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
        {/* Top bar */}
        <View style={s.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.DARK} />
            <Text style={[s.bold, { color: colors.DARK }]}>Back</Text>
          </Pressable>
        </View>

        {/* Avatar */}
        <View style={{ alignItems: "center", marginTop: 6, marginBottom: 8 }}>
          <View style={s.avatar}>
            <Ionicons name="person" size={44} color="#fff" />
          </View>
        </View>

        {/* Fields */}
        <FormRow label="Full Name" value={fullName} onChangeText={setFullName} colors={colors} />
        <FormRow label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" colors={colors} />
        <FormRow label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" colors={colors} />
        <FormRow label="Organisation" value={org} onChangeText={setOrg} colors={colors} />

        {/* Units */}
        <Text style={[s.label, { marginTop: 8 }]}>Units</Text>
        <View style={{ gap: 10, marginTop: 6 }}>
          <Radio label="Metric" checked={unit === "metric"} onPress={() => setUnit("metric")} colors={colors} />
          <Radio label="Imperial" checked={unit === "imperial"} onPress={() => setUnit("imperial")} colors={colors} />
        </View>

        {/* 2FA */}
        <View style={[s.rowBetween, { marginTop: 18 }]}>
          <Text style={s.label}>Two Factor Authentication</Text>
          <Switch
            value={twoFA}
            onValueChange={setTwoFA}
            trackColor={{ false: colors.MUTED, true: "#7DD07D" }}
            thumbColor="#fff"
          />
        </View>

        {/* Save Button */}
        <Pressable
          onPress={saveProfile}
          style={({ pressed }) => [
            { marginTop: 24, backgroundColor: colors.PURPLE, padding: 12, borderRadius: 10 },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Save Changes</Text>
        </Pressable>
      </ScrollView>

      {/* Bottom bar */}
      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
}

/* ----- small components ----- */

function FormRow({
  label,
  colors,
  ...inputProps
}: {
  label: string;
  colors: ReturnType<typeof themeShape>;
} & React.ComponentProps<typeof TextInput>) {
  const s = styles(colors);
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputWrap}>
        <TextInput style={s.input} placeholderTextColor={colors.MUTED} {...inputProps} />
      </View>
    </View>
  );
}

function Radio({
  label,
  checked,
  onPress,
  colors,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  colors: ReturnType<typeof themeShape>;
}) {
  const s = styles(colors);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.radioRow, pressed && { opacity: 0.9 }]}>
      <View style={[s.radioOuter, checked && { borderColor: colors.PURPLE }]}>
        {checked && <View style={s.radioInner} />}
      </View>
      <Text style={s.radioLabel}>{label}</Text>
    </Pressable>
  );
}

/* ----- themed styles ----- */

const themeShape = () => ({
  BACK: "" as string,
  TEXT: "" as string,
  PURPLE: "" as string,
  LAVENDER: "" as string,
  DARK: "" as string,
  CARD: "" as string,
  INPUT: "" as string,
  MUTED: "" as string,
});

const styles = (C: ReturnType<typeof themeShape>) =>
  StyleSheet.create({
    bold: { fontWeight: "700" },
    container: { flex: 1, backgroundColor: C.BACK },

    topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: C.CARD,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },

    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: C.PURPLE,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
                ios: {
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        },
        android: { elevation: 4 },
      }),
    },

    label: { fontWeight: "700", color: C.DARK },
    inputWrap: {
      marginTop: 6,
      backgroundColor: C.LAVENDER,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 46,
      justifyContent: "center",
    },
    input: { color: C.TEXT, fontSize: 15, padding: 0 },

    radioRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    radioOuter: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: C.MUTED,
      alignItems: "center",
      justifyContent: "center",
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: C.PURPLE,
    },
    radioLabel: { color: C.DARK, fontWeight: "600" },

    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    bottomBarWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
  });