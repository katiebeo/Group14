import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export default function RegisterWebScreen() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: "https://staging.binarymed.io/register" }}
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