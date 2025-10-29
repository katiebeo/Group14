import React, { useEffect, useState, useMemo } from "react";
import {
  
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AppHeader from "../../components/header";
import BottomBar from "../../components/bottombar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../constants/theme";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManifestList() {
  const { colors } = useTheme();
  const s = styles(colors);
  const { trackerId } = useLocalSearchParams();
  const [manifests, setManifests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManifests = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        const orgId = await AsyncStorage.getItem("organisationId");
        if (!token || !orgId || !trackerId) throw new Error("Missing credentials or tracker ID");

        const headers = {
          Authorization: `Bearer ${token}`,
          OrganisationId: orgId.trim(),
        };

        const res = await fetch(
          `https://stagingapi.binarytech.io/v1/manifests?$filter=SensorId eq '${trackerId}'&$orderby=CreatedTime desc&$top=20`,
          { headers }
        );

        if (!res.ok) throw new Error("Failed to fetch manifests");

        const raw = await res.json();

        const mapped = raw.map((m: any, index: number) => ({
          Id: String(m.id ?? index),
          Name: m.name ?? "Unnamed",
          Description: m.description ?? "No description",
          SensorId: m.sensorId ?? "N/A",
          Status: m.status ?? "Unknown",
          StartingUserName: m.startingUserName ?? "—",
          CreatedTime: m.createdTime ?? new Date().toISOString(),
          StartTime: m.startTime ?? m.createdTime,
        }));

        setManifests(mapped);
      } catch (err: any) {
        console.error("Manifest fetch error:", err);
        Alert.alert("Error", err.message ?? "Unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchManifests();
  }, [trackerId]);

  const sorted = useMemo(() => {
    return [...manifests].sort((a, b) => new Date(b.CreatedTime).getTime() - new Date(a.CreatedTime).getTime());
  }, [manifests]);

  return (
    <SafeAreaView style={s.container}>
      <AppHeader onAvatarPress={() => router.push("/profile")} showBack />
      <Text style={s.title}>Manifests for Tracker {trackerId}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.PURPLE} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.Id}
          renderItem={({ item }) => <ManifestRow item={item} colors={colors} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
}

const ManifestRow: React.FC<{ item: any; colors: any }> = ({ item, colors }) => {
  const date = new Date(item.StartTime ?? item.CreatedTime);
  const day = isNaN(date.getDate()) ? "?" : date.getDate();
  const month = isNaN(date.getTime()) ? "???" : date.toLocaleString("default", { month: "short" });

  const getStatusColor = (status: string = "") => {
    const activeStatuses = [
      "Not Started",
      "Started, OK", "Started, Ok", "Started, ok",
      "Start",
      "Active",
    ];
    const warningStatuses = [
      "Ended",
      "Finished, OK", "Finished, WARNING",
      "Started, WARNING", "Started, Warning", "Started, warning",
    ];
    if (activeStatuses.includes(status)) return "#22C55E";
    if (warningStatuses.includes(status)) return "#E63946";
    return "#999";
  };

  const statusColor = getStatusColor(item.Status);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/quickaction/ManifestPage",
          params: { id: item.Id, name: item.Name },
        })
      }
      style={({ pressed }) => [
        {
          backgroundColor: colors.CARD,
          borderRadius: 16,
          padding: 14,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        {/* Left: Date Badge */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: colors.INPUT,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "700", color: colors.DARK }}>{month.toUpperCase()}</Text>
          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.DARK }}>{day}</Text>
        </View>

        {/* Middle: Manifest Info */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.DARK }}>{item.Name}</Text>
          <Text style={{ fontSize: 13, color: colors.DARK }}>
            {item.StartingUserName?.split(" (")[0] ?? "—"}
          </Text>
          <Text style={{ fontSize: 12, color: "#555" }}>
            {item.Description}
          </Text>
          <Text style={{ fontSize: 12, color: "#555" }}>Tracker #{item.SensorId}</Text>
        </View>

        {/* Right: Status Pill */}
        <View
          style={{
            backgroundColor: statusColor,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>{item.Status}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.BACK,
      paddingHorizontal: 16,
      paddingTop: Platform.select({ ios: 4, android: 10 }),
    },
    title: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.DARK,
      marginTop: 14,
      marginBottom: 8,
      paddingHorizontal: 8,
      textAlign: "center",
    },
    bottomBarWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
  });