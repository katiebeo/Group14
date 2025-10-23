import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AutoLoginSignInScreen() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    async function buildUrl() {
      const email = await AsyncStorage.getItem("user_email");
      const password = await AsyncStorage.getItem("user_password");
      if (email && password) {
        const encodedEmail = encodeURIComponent(email);
        const encodedPassword = encodeURIComponent(password);
        setUrl(`https://staging.binarymed.io/sign-in?email=${encodedEmail}&password=${encodedPassword}`);
      } else {
        setUrl("https://staging.binarymed.io/sign-in");
      }
    }
    buildUrl();
  }, []);

  if (!url) return null;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
    padding: 0,
  },
  webview: {
    flex: 1,
    margin: 0,
    padding: 0,
  },
});