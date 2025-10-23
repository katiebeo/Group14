import React from "react";
import { View, StyleSheet } from "react-native";

const InfoDot = () => (
  <View style={styles.dot} />
);

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#888",
    marginLeft: 6,
    marginTop: 6,
  },
});

export default InfoDot;