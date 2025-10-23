import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    marginHorizontal: 16,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 4,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  mapWrap: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBarWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  scroll: {
    padding: 16,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  value: {
    fontWeight: "400",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  map: {
    height: 300,
    borderRadius: 8,
  },
});