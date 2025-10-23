// app/index.tsx
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../constants/theme";
import { SafeAreaView } from 'react-native-safe-area-context';


// ←– configure your base URL here or import from .env
const API_BASE_URL = "https://stagingapi.binarytech.io";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

const onSignIn = async () => {
  if (!email.trim() || !password.trim()) {
    Alert.alert("Validation", "Email and password are required.");
    return;
  }

  setLoading(true);
  try {
    // Step 1: Authenticate
    const resp = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password,
        noExpire: true,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.message || "Authentication failed");
    }

    const json = await resp.json();
    const token = json.access_token;
    const userId = json.id ?? json.userId; // ✅ Extract user ID from response

    if (!token || !userId) throw new Error("Missing access token or user ID");

    // ✅ Store all required values
    await AsyncStorage.setItem("access_token", token);
    await AsyncStorage.setItem("user_email", email.trim());
    await AsyncStorage.setItem("user_password", password);
    await AsyncStorage.setItem("userId", userId); // ✅ Added line

    // Step 2: Fetch organisation list
    const orgResp = await fetch(`${API_BASE_URL}/API/editorganisation`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const raw = await orgResp.text();
    console.log("Raw organisation response:", raw);

    if (!raw || raw.trim() === "") {
      throw new Error("Empty response from organisation endpoint");
    }

    let orgData;
    try {
      orgData = JSON.parse(raw);
    } catch (err) {
      console.error("JSON parse error:", err);
      throw new Error("Invalid JSON from organisation endpoint");
    }

    if (!Array.isArray(orgData) || !orgData[0]?.id) {
      console.warn("Unexpected organisation array format:", orgData);
      throw new Error("Organisation ID not found in response array");
    }

    const organisationId = orgData[0].id;
    await AsyncStorage.setItem("organisationId", organisationId);

    // Step 3: Navigate to homepage
    router.replace("/homepage");
  } catch (err: any) {
    Alert.alert("Login Error", err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.brandRow}>
            <Image
              source={require("../assets/images/logo_bina.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Input Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#CBBFDB"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#CBBFDB"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Footer Links */}
          <View style={styles.linksRow}>
            <Link href="/web/forgot" style={styles.link}>
              Forgot Password
            </Link>

            <Link href="/web/register" style={styles.link}>
              New User?
            </Link>
          </View>

          {/* Sign In Button */}
          <Pressable
            onPress={onSignIn}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              pressed && { opacity: 0.9 },
              loading && { opacity: 0.6 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.LAVENDER },
  content: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 },
  brandRow: {
    marginTop: 24,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logo: { width: 300, height: 150 },
  card: {
    backgroundColor: COLORS.PURPLE,
    borderRadius: 16,
    padding: 16,
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
  label: {
    color: "#1F1F1F",
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: COLORS.LAVENDER,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 4,
  },
  link: { color: COLORS.DARK, fontSize: 13, fontWeight: "500" },
  button: {
    alignSelf: "center",
    marginTop: 28,
    paddingHorizontal: 28,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.PURPLE,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});