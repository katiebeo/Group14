import { router, useLocalSearchParams } from "expo-router";
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
import { COLORS } from "../constants/theme";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? "";
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const onSave = () => {
    if (pass.length < 8) {
      Alert.alert("Weak password", "Use at least 8 characters.");
      return;
    }
    if (pass !== confirm) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }
    // TODO: call your backend to actually reset the password with token/email
    Alert.alert("Password updated", "You can now sign in.", [
      { text: "OK", onPress: () => router.replace("/") }, // go back to login
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.LAVENDER }}>
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

          <Text style={styles.title}>New Password</Text>
          <Text style={styles.subtitle}>
            Please create a new password{email ? ` for ${email}` : ""}.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Create new password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create new password"
              placeholderTextColor="#CBBFDB"
              secureTextEntry
              value={pass}
              onChangeText={setPass}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#CBBFDB"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />
          </View>

          <Pressable onPress={onSave} style={({ pressed }) => [
            styles.button, pressed && { opacity: 0.9 }
          ]}>
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: "800", color: COLORS.DARK, textAlign: "center" },
  subtitle: { marginTop: 4, textAlign: "center", color: COLORS.DARK, opacity: 0.7 },
  card: {
    backgroundColor: COLORS.PURPLE, borderRadius: 16, padding: 16, marginTop: 18,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 4 },
    }),
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
  label: { color: "#1F1F1F", fontSize: 14, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: COLORS.LAVENDER, borderRadius: 14, height: 46,
    paddingHorizontal: 14, fontSize: 16,
  },
  button: {
    alignSelf: "center", marginTop: 22, height: 48, paddingHorizontal: 28,
    borderRadius: 14, backgroundColor: COLORS.PURPLE, alignItems: "center", justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "800" },
});
