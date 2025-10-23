import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useTheme } from "../../constants/theme";

export default function DocumentationWebView() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.BACK }}>
      <WebView
        source={{ uri: "https://binarymed.notion.site/" }}
        style={{ flex: 1 }}
        originWhitelist={["*"]}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit
      />
    </SafeAreaView>
  );
}