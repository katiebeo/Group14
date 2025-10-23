// app/webpage.tsx
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";

export default function MapWebView() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      const t = await AsyncStorage.getItem("access_token");
      setToken(t);
    };
    loadToken();
  }, []);

  if (!token) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Option 1: Pass token via query param (if backend supports it)
  const url = `https://staging.binarymed.io/?range=last-3-months&token=${encodeURIComponent(token)}`;

  // Option 2: Inject token via headers (requires backend support)
  // const headers = { Authorization: `Bearer ${token}` };

  return (
    <WebView
      source={{ uri: url }}
      style={{ flex: 1 }}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={["*"]}
      // Optionally inject headers:
      // source={{ uri: "https://staging.binarymed.io", headers }}
    />
  );
}