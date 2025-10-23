
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView, Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text, TextInput,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

const PURPLE = "#7B3FA2";
const LAVENDER = "#EEE7F4";
const DARK = "#3F3F46";


export default function ForgotScreen() {
  const [email, setEmail] = useState("");

  const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const onContinue = async () => {
  if (!validEmail(email)) {
    Alert.alert("Invalid email", "Please enter a valid email address.");
    return;
  }

  try {
    const res = await fetch("https://stagingapi.binarytech.io/v1/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("Reset request failed:", err);
      Alert.alert("Error", "Could not send reset email. Please try again.");
      return;
    }

    Alert.alert(
      "Email Sent",
      "Check your inbox for a password reset link.",
      [{ text: "OK", onPress: () => router.push({ pathname: "/reset", params: { email } }) }]
    );
  } catch (err: any) {
    console.error("Reset error:", err.message);
    Alert.alert("Network Error", "Please check your connection and try again.");
  }
};
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEE7F4" }}>
      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Brand / Logo */}
          <View style={styles.brandRow}>
            <Image
              source={require("../assets/images/logo_bina.png")} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>      

          {/* Title */}
          <Text style={styles.title}>Forgot Password</Text>
          

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor="#CBBFDB"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Button */}
          <Pressable onPress={onContinue} style={({ pressed }) => [
            styles.button, pressed && { opacity: 0.9 }
          ]}>
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 40 },
  title: {
    fontSize: 30, fontWeight: "800", color: "#3F3F46", textAlign: "center",
  },
  subtitle: {
    marginTop: 4, textAlign: "center", color: "#3F3F46", opacity: 0.7,
  },
    brandRow: {
      marginTop: 24,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logo: {
    width: 300,
    height: 150,
  },
  card: {
    backgroundColor: "#7B3FA2", borderRadius: 16, padding: 16, marginTop: 18,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 4 },
    }),
  },
  label: { color: "#1F1F1F", fontSize: 14, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: "#EEE7F4", borderRadius: 14, height: 46,
    paddingHorizontal: 14, fontSize: 16,
  },
  button: {
    alignSelf: "center", marginTop: 22, height: 48, paddingHorizontal: 28,
    borderRadius: 14, backgroundColor: "#7B3FA2", alignItems: "center", justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "800" },
});
