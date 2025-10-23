import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

const PURPLE = "#7B3FA2";
const LAVENDER = "#EEE7F4";
const DARK = "#3F3F46";

export default function SignUpScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const validateEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const onSignUp = async () => {
  if (!fullName || !email || !password || !confirm) {
    Alert.alert("Missing info", "Please fill in all fields.");
    return;
  }
  if (!validateEmail(email)) {
    Alert.alert("Invalid email", "Please enter a valid email address.");
    return;
  }
  if (password.length < 8) {
    Alert.alert("Weak password", "Use at least 8 characters.");
    return;
  }
  if (password !== confirm) {
    Alert.alert("Password mismatch", "Passwords do not match.");
    return;
  }

  try {
    const res = await fetch("https://stagingapi.binarytech.io/v1/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: fullName,
        email,
        password,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("Signup failed:", err);
      Alert.alert("Signup Error", "Could not create account. Please try again.");
      return;
    }

    Alert.alert("Account created 🎉", "You can now sign in.", [
      { text: "OK", onPress: () => router.replace("/") },
    ]);
  } catch (err: any) {
    console.error("Signup error:", err.message);
    Alert.alert("Network Error", "Please check your connection and try again.");
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
          {/* Brand / Logo */}
          <View style={styles.brandRow}>
            <Image
              source={require("../assets/images/logo_bina.png")} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#CBBFDB"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
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

            <Text style={[styles.label, { marginTop: 12 }]}>
              Confirm Password
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#CBBFDB"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />
          </View>

          {/* Footer link */}
          <Text style={styles.footerText}>
            Already a user?{" "}
            <Link href="/" style={styles.footerLink}>
              Sign in
            </Link>
          </Text>

          {/* Primary button */}
          <Pressable onPress={onSignUp} style={({ pressed }) => [
              styles.button,
              pressed && { opacity: 0.9 },
            ]}>
            <Text style={styles.buttonText}>Sign up</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LAVENDER },
  content: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 },
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
  brand: { fontSize: 34, fontWeight: "800", letterSpacing: 0.5 },
  card: {
    backgroundColor: PURPLE,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 4 },
    }),
  },
  label: { color: "#1F1F1F", fontSize: 14, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: LAVENDER,
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  footerText: {
    alignSelf: "center",
    marginTop: 10,
    fontSize: 13,
    color: DARK,
  },
  footerLink: { fontWeight: "700", textDecorationLine: "underline" },
  button: {
    alignSelf: "center",
    marginTop: 16,
    paddingHorizontal: 28,
    height: 48,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "800" },
});
