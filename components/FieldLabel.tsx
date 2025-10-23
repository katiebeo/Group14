import React from "react";
import { Text, View, StyleSheet } from "react-native";

const FieldLabel = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.wrap, style]}>
    <Text style={styles.label}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});

export default FieldLabel;