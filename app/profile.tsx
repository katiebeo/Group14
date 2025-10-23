import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomBar from "../components/bottombar";
import { useTheme } from "../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const { colors, isDark, toggle } = useTheme();
  const { refresh } = useLocalSearchParams();
  const s = styles(colors);

  const [profileData, setProfileData] = useState<any>(null);
  const [showSupport, setShowSupport] = useState(false);

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
      setProfileData(result);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to load profile.");
    }
  };

  useEffect(() => {
    loadProfile();
  }, [refresh]);

  const onAccountSettings = () => router.push("/setting");
  const onLogout = () => router.replace("/");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.BACK }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
        {/* Back */}
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.DARK} />
            <Text style={[s.boldText, { color: colors.DARK }]}>Back</Text>
          </Pressable>
        </View>

        {/* Avatar + name */}
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <View style={s.avatar}>
            <Ionicons name="person" size={44} color="#fff" />
          </View>
          <Text style={[s.boldText, { marginTop: 10, fontSize: 16, color: colors.TEXT }]}>
            {profileData?.fullName ?? "Loading..."}
          </Text>
          <Text style={{ fontSize: 13, color: colors.MUTED }}>
            {profileData?.email ?? ""}
          </Text>

          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [s.logout, pressed && { opacity: 0.9 }]}
          >
            <Text style={[s.boldText, { color: colors.DARK }]}>Log off</Text>
          </Pressable>
        </View>

        {/* Switch Organisation card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <MaterialCommunityIcons name="swap-horizontal" size={18} color={colors.DARK} />
            <Text style={[s.boldText, { color: colors.DARK }]}>Switch Organisation</Text>
          </View>

          <View style={{ flexDirection: "row" }}>
            <Pressable onPress={onAccountSettings} style={[s.tile, s.tileLeft]}>
              <Ionicons name="person-circle" size={22} color={colors.TEXT} />
              <Text style={[s.tileTitle, { color: colors.DARK }]}>Account{"\n"}Setting</Text>
            </Pressable>

            <Pressable onPress={toggle} style={s.tile}>
              <Ionicons name={isDark ? "moon" : "sunny-outline"} size={22} color={colors.TEXT} />
              <Text style={[s.tileTitle, { color: colors.DARK }]}>
                {isDark ? "Toggle\nLight Mode" : "Toggle\nDark Mode"}
              </Text>
            </Pressable>

            <Pressable style={[s.tile, s.tileRight]}>
              <Ionicons name="people-outline" size={22} color={colors.TEXT} />
              <Text style={[s.tileTitle, { color: colors.DARK }]}>Organisation</Text>
            </Pressable>
          </View>
        </View>

        {/* Settings list */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.DARK, borderColor: colors.MUTED }]}>
            Settings
          </Text>

          <Pressable style={s.listItem} onPress={() => router.push("/web/documentation")}>
            <Ionicons name="book-outline" size={18} color={colors.TEXT} />
            <Text style={[s.listItemText, { color: colors.DARK }]}>Documentation</Text>
          </Pressable>

          <Pressable
            style={[s.listItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.MUTED }]}
            onPress={() => setShowSupport(true)}
          >
            <Ionicons name="help-buoy-outline" size={18} color={colors.TEXT} />
            <Text style={[s.listItemText, { color: colors.DARK }]}>Feedback & Support</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>

      {/* Support Modal */}
      <Modal visible={showSupport} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.BACK }}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={[s.boldText, { fontSize: 18, marginBottom: 8 }]}>Submit a Support Request</Text>
            <Text style={{ fontSize: 14, marginBottom: 16, color: colors.MUTED }}>
              If you're experiencing an issue or need assistance with the Binary Cloud app or a tracker, our support team is here to help.
            </Text>

            <SupportForm onClose={() => setShowSupport(false)} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- Support Form ---------- */
function SupportForm({ onClose }: { onClose: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [region, setRegion] = useState("");
  const [priority, setPriority] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [description, setDescription] = useState("");

  const submitRequest = async () => {
    try {
      const payload = {
        firstName,
        email,
        company,
        region,
        priority,
        ticketName,
        description,
      };

      const res = await fetch("https://your-backend-url.com/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit support request");

      Alert.alert("Success", "Your support request has been submitted.");
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Submission failed.");
    }
  };

  return (
    <View>
      <FormField label="First Name*" value={firstName} onChangeText={setFirstName} />
      <FormField label="Email*" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <FormField label="Company Name*" value={company} onChangeText={setCompany} />
      <FormField label="Region*" value={region} onChangeText={setRegion} />
      <FormField label="Priority*" value={priority} onChangeText={setPriority} />
      <FormField label="Ticket Name*" value={ticketName} onChangeText={setTicketName} />
      <FormField label="Ticket Description*" value={description} onChangeText={setDescription} multiline />

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
        <Pressable
          onPress={onClose}
          style={{
            backgroundColor: "#ccc",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ fontWeight: "700", color: "#333" }}>Close</Text>
        </Pressable>

        <Pressable
          onPress={submitRequest}
          style={{
            backgroundColor: "#7D5FFF", // or colors.PURPLE if themed
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ fontWeight: "700", color: "#fff" }}>Submit</Text>
        </Pressable>
      </View>
    </View>
  );
}


function FormField({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontWeight: "600", marginBottom: 4 }}>{label}</Text>
      <TextInput
        style={{
          backgroundColor: "#F0F0F0",
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
        placeholderTextColor="#999"
        {...props}
      />
    </View>
  );
}


/* ---------- themed styles ---------- */
const styles = (C: typeof import("../constants/theme").light) =>
  StyleSheet.create({
    boldText: { fontWeight: "700" },

    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: C.CARD,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      alignSelf: "flex-start",
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
    logout: {
      marginTop: 10,
      backgroundColor: C.CARD,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      alignSelf: "center",
    },

    card: {
      backgroundColor: C.CARD,
      borderRadius: 12,
      marginTop: 16,
      overflow: "hidden",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: C.MUTED,
    },
    tile: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 16,
      backgroundColor: C.CARD,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderColor: C.MUTED,
    },
    tileLeft: { borderTopWidth: 0 },
    tileRight: { borderRightWidth: 0 },
    tileTitle: { textAlign: "center", lineHeight: 18, fontWeight: "600" },

    section: {
      backgroundColor: C.CARD,
      borderRadius: 12,
      marginTop: 16,
      paddingBottom: 6,
    },
        sectionTitle: {
      fontWeight: "800",
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    listItemText: {
      fontWeight: "600",
    },
    bottomBarWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
  });