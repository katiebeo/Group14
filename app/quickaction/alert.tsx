import { Feather } from "@expo/vector-icons"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native"; // ✅ correct source
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomBar from "../../components/bottombar";
import AppHeader from "../../components/header";
import { useTheme } from "../../constants/theme";
import { useAlerts } from "../../context/AlertContext";

type AlertStatus = "Active" | "Resolved";
type AlertItem = {
  id: string | number;
  title: string;
  dateISO: string;
  status: AlertStatus;
};

export default function AlertsPage() {
  const { colors } = useTheme();
  const s = useMemo(() => styles(colors), [colors]);
  const { alerts, refreshAlerts } = useAlerts() as {
    alerts: AlertItem[];
    refreshAlerts: () => Promise<void> | void;
  };

  const [filter, setFilter] = useState<"All" | "Active" | "Resolved">("All");
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolving, setResolving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshAlerts();
    }, [refreshAlerts])
  );

  const filtered = useMemo(() => {
    if (filter === "All") return alerts ?? [];
    return (alerts ?? []).filter((a) => a.status === filter);
  }, [alerts, filter]);

  const activeCount = (alerts ?? []).filter((a) => a.status === "Active").length;
  const resolvedCount = (alerts ?? []).filter((a) => a.status === "Resolved").length;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.headerWrap}>
        <AppHeader onAvatarPress={() => router.push("/profile")} showBack />
      </View>

      <View
        style={[
          s.header,
          { backgroundColor: colors.BACK, borderColor: colors.MUTED },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[s.backIcon, { color: colors.TEXT }]}>‹</Text>
        </Pressable>

        <Text style={[s.headerTitle, { color: colors.TEXT }]} numberOfLines={1}>
          Alerts
        </Text>
        <View style={s.headerRightStub} />
      </View>

      <View style={s.topBar} />

      <View style={s.quickRow}>
        <ActionCard
          labelTop=""
          labelBottom={`All (${alerts?.length ?? 0})`}
          selected={filter === "All"}
          onPress={() => setFilter("All")}
          icon={<Feather name="list" size={22} color={colors.TEXT} />}
          colors={colors}
        />
        <ActionCard
          labelTop={`${activeCount}`}
          labelBottom="Active"
          selected={filter === "Active"}
          onPress={() => setFilter("Active")}
          icon={<Feather name="alert-triangle" size={22} color="#EF4444" />}
          colors={colors}
        />
        <ActionCard
          labelTop={`${resolvedCount}`}
          labelBottom="Resolved"
          selected={filter === "Resolved"}
          onPress={() => setFilter("Resolved")}
          icon={<Feather name="check-circle" size={22} color="#22C55E" />}
          colors={colors}
        />
      </View>

      <Text style={s.sectionTitle}>
        {filter === "All" ? "Recent Alerts" : `${filter} Alerts`}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refreshAlerts} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => item.status === "Active" && setSelectedAlert(item)}
            style={s.alertCard}
          >
            <Text style={s.alertTitle}>{item.title}</Text>
            <Text style={s.alertDate}>{item.dateISO}</Text>
            <StatusBadge status={item.status} />
          </Pressable>
        )}
        ListEmptyComponent={<Text style={s.emptyText}>No alerts found.</Text>}
      />

      {selectedAlert && (
        <View style={s.modalBackdrop}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Resolution Notes</Text>
            <TextInput
              multiline
              value={resolutionNote}
              onChangeText={setResolutionNote}
              placeholder="Enter resolution details..."
              placeholderTextColor={colors.MUTED}
              style={s.modalInput}
              underlineColorAndroid="transparent"
            />
            <View style={s.modalActions}>
              <Pressable onPress={() => setSelectedAlert(null)}>
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (!selectedAlert) return;
                  setResolving(true);
                  try {
                    await resolveAlert(String(selectedAlert.id), resolutionNote);
                    setSelectedAlert(null);
                    setResolutionNote("");
                    await refreshAlerts();
                  } catch (e) {
                    console.error("Resolution failed:", e);
                  } finally {
                    setResolving(false);
                  }
                }}
                style={s.resolveBtn}
              >
                <Text style={s.resolveBtnText}>
                  {resolving ? "Resolving..." : "Resolve"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
}

function ActionCard({
  colors,
  selected,
  labelTop,
  labelBottom,
  icon,
  onPress,
}: {
  colors: any;
  selected: boolean;
  labelTop: string;
  labelBottom: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: "32%",
          padding: 12,
          borderRadius: 16,
          backgroundColor: selected ? colors.PURPLE : colors.CARD,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={{ alignItems: "flex-end" }}>{icon}</View>
      {!!labelTop && (
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: selected ? colors.LAVENDER : colors.TEXT,
            marginTop: 6,
          }}
        >
          {labelTop}
        </Text>
      )}
      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
          color: selected ? colors.LAVENDER : colors.TEXT,
          marginTop: 2,
        }}
      >
        {labelBottom}
      </Text>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: "Active" | "Resolved" }) {
  return (
    <View
      style={{
        backgroundColor: status === "Active" ? "#EF4444" : "#22C55E",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        alignSelf: "flex-start",
        marginTop: 8,
      }}
    >
      <Text style={{ fontWeight: "800", color: "#fff" }}>{status}</Text>
    </View>
  );
}

async function resolveAlert(alertId: string, note: string) {
  const tokenKeys = ["access_token", "authToken", "token"];
  let token: string | null = null;

  for (const key of tokenKeys) {
    token = await SecureStore.getItemAsync(key);
    if (token) break;
  }
  if (!token) {
    for (const key of tokenKeys) {
      token = await AsyncStorage.getItem(key);
      if (token) break;
    }
  }

  const orgId = await AsyncStorage.getItem("organisationId");
  if (!token || !orgId) throw new Error("Missing credentials");

  const res = await fetch(`https://stagingapi.binarytech.io/api/alertnotifications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      OrganisationId: orgId,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "resolve",
      resolutionNote: note,
      alertId: Number(alertId),
    }),
  });

  const text = await res.text();
  console.log("Resolution response:", text);

  if (!res.ok) throw new Error(`Resolution failed: ${res.status}`);
  return true;
}

const styles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.BACK },
    headerWrap: { paddingTop: 12, paddingBottom: 4, backgroundColor: colors.BACK },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      marginBottom: 12,
      height: 44,
    },
    topBarTitle: { fontSize: 28, fontWeight: "800", color: colors.TEXT, marginLeft: 12 },
    quickRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.TEXT,
      marginBottom: 10,
      marginTop: 6,
      paddingHorizontal: 8,
    },
    listContent: { paddingBottom: 90, paddingHorizontal: 8 },
    alertCard: {
      backgroundColor: colors.CARD,
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
    },
    alertTitle: {
      fontWeight: "700",
      color: colors.TEXT,
    },
    alertDate: {
      fontSize: 12,
      color: colors.MUTED,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    backBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 22,
    },
    backIcon: {
      fontSize: 28,
      fontWeight: "600",
      lineHeight: 28,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 28,
      fontWeight: "800",
      paddingHorizontal: 8,
    },
    headerRightStub: {
      width: 44,
      height: 44,
    },

    emptyText: {
      padding: 16,
      color: colors.MUTED,
      textAlign: "center",
    },
    modalBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalBox: {
      backgroundColor: colors.CARD,
      borderRadius: 16,
      padding: 20,
      width: "100%",
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
      color: colors.TEXT,
    },
    modalInput: {
      minHeight: 80,
      color: colors.TEXT,
      backgroundColor: colors.INPUT,
      borderWidth: 1,
      borderColor: colors.MUTED,
      borderRadius: 8,
      padding: 10,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 16,
    },
    cancelText: {
      color: colors.TEXT,
      fontWeight: "600",
    },
    resolveBtn: {
      backgroundColor: colors.PURPLE,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },
    resolveBtnText: {
      color: colors.LAVENDER,
      fontWeight: "700",
    },
    bottomBarWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
  });
