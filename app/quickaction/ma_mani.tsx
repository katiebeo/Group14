// app/quickaction/my-manifests.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BottomBar from "../../components/bottombar";
import AppHeader from "../../components/header";
import { useTheme } from "../../constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { fetchUserManifests, ManifestItem, ManifestStatus, ManifestRole } from "./manifest-utils";
import { SafeAreaView } from 'react-native-safe-area-context';











/* ---------- Helpers ---------- */

const monthMap: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const parseDateFlexible = (s: string | undefined | null) => {
  if (!s || typeof s !== "string") return new Date(); // fallback to now

  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;

  const m = s.trim().match(/^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mon = monthMap[m[2].toLowerCase()];
    const y = parseInt(m[3], 10);
    if (mon >= 0) return new Date(y, mon, d);
  }

  return new Date(); // fallback again
};

const formatBadge = (s: string) => {
  const d = parseDateFlexible(s);
  return {
    day: d.getDate(),
    month: d.toLocaleString(undefined, { month: "short" }).toUpperCase(),
  };
};

// Match Alerts palette for status pills
const statusDotColor = (status: ManifestStatus) =>
  status === "Started, WARNING" ? "#E63946" : "#22C55E";

/* ---------- Screen ---------- */

type Filter = "All" | "Active" | "Finished";

  export default function MyManifestsScreen() {
  const { colors } = useTheme();
  const s = styles(colors);

    // Data / filter / sort
  const [manifests, setManifests] = useState<ManifestItem[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  useEffect(() => {
  const loadManifests = async () => {
    try {
      const data = await fetchUserManifests();
      if (Array.isArray(data)) {
        setManifests(data);
      } else {
        console.warn("Unexpected manifest data:", data);
        setManifests([]);
      }
    } catch (err: any) {
      console.warn("Failed to load manifests:", err.message);
      setManifests([]); // fallback to empty array
    }
  };

  loadManifests();
}, []);


  // Header
  const [notifications] = useState<string[]>([]);
  const onAvatarPress = () => router.push("/profile");




  

  const startingCount = useMemo(
    () => manifests.filter((m) => m.role === "Starting User").length,
    [manifests]
  );
  const endingCount = useMemo(
    () => manifests.filter((m) => m.role === "Ending User").length,
    [manifests]
  );

  const sorted = useMemo(
    () =>
      [...manifests].sort(
        (a, b) => parseDateFlexible(b.dateCreated).getTime() - parseDateFlexible(a.dateCreated).getTime()
      ),
    [manifests]
  );
const filtered = useMemo(() => {
  if (filter === "All") return sorted;

  if (filter === "Active") {
    const activeStatuses = [
      "Not Started",
      "Started, OK", "Started, Ok", "Started, ok",
      "Started, WARNING", "Started, Warning", "Started, warning",
      "Start",
      "Active",
    ];
    return sorted.filter((m) => activeStatuses.includes(m.status));
  }

  if (filter === "Finished") {
    return sorted.filter((m) =>
      ["Ended", "Finished, OK", "Finished, WARNING"].includes(m.status)
    );
  }

  return sorted;
}, [sorted, filter]);

  return (
    <SafeAreaView style={[s.container, { paddingBottom: 80 }]}>
      <AppHeader
  onAvatarPress={onAvatarPress}
  showBack
  />


      <Text style={s.title}>My Manifests</Text>

      {/* Filters / Quick Actions — same look as Alerts */}
      <View style={s.quickRow}>
        <ActionCard
          colors={colors}
          selected={filter === "All"}
          labelTop=""
          labelBottom={`All (${manifests.length})`}
          icon={<Feather name="list" size={22} color={colors.DARK} />}
          onPress={() => setFilter("All")}
        />
        <ActionCard
          colors={colors}
          selected={filter === "Active"}
          labelTop={`${manifests.filter((m) =>
            [
              "Not Started",
              "Started, OK", "Started, Ok", "Started, ok",
              "Started, WARNING", "Started, Warning", "Started, warning",
              "Start",
              "Active",
            ].includes(m.status)
          ).length}`}
          labelBottom="Active Manifests"
          icon={<Feather name="play-circle" size={22} color={colors.DARK} />}
          onPress={() => setFilter("Active")}
        />
        <ActionCard
          colors={colors}
          selected={filter === "Finished"}
         labelTop={`${manifests.filter((m) => ["Finished, OK", "Finished, WARNING", "Ended"].includes(m.status)).length}`}
          labelBottom="Finished"
          icon={<Feather name="check-circle" size={22} color={colors.DARK} />}
          onPress={() => setFilter("Finished")}
        />
      </View>

      <Text style={s.sectionTitle}>
        {filter === "All" ? "Recent Manifests" : `${filter}`}
      </Text>

      <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ManifestRow item={item} colors={colors} />}
          contentContainerStyle={{ paddingBottom: 100 }} // ✅ Add enough bottom padding
          showsVerticalScrollIndicator={false}
        />

      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
}

/* ---------- Subcomponents ---------- */

type ActionCardProps = {
  colors: any;
  selected: boolean;
  labelTop: string;
  labelBottom: string;
  icon: React.ReactNode;
  onPress: () => void;
};

const ActionCard: React.FC<ActionCardProps> = ({
  colors,
  selected,
  labelTop,
  labelBottom,
  icon,
  onPress,
}) => {
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
            color: selected ? colors.LAVENDER : colors.DARK,
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
          color: selected ? colors.LAVENDER : colors.DARK,
          marginTop: 2,
        }}
      >
        {labelBottom}
      </Text>
    </Pressable>
  );
};

const ManifestRow: React.FC<{ item: ManifestItem; colors: any }> = ({ item, colors }) => {
  const date = new Date(item.dateCreated);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  


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

      if (activeStatuses.includes(status)) return "#22C55E"; // ✅ Green
      if (warningStatuses.includes(status)) return "#E63946"; // ✅ Red

      return "#999"; // fallback gray
    };
  const statusColor = getStatusColor(item.status);

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/quickaction/ManifestPage", params: { id: item.id, name: item.name } })}
      
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
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.DARK }}>{item.name}</Text>
          <Text style={{ fontSize: 13, color: colors.DARK }}>
            {item.startingUserName?.split(" (")[0] ?? "—"}
          </Text>
          <Text style={{ fontSize: 12, color: "#555" }}>
            {item.description ?? "No description"}
          </Text>
          <Text style={{ fontSize: 12, color: "#555" }}>Tracker #{item.trackerId}</Text>
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
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>{item.status}</Text>
        </View>
      </View>
    </Pressable>
  );
};

/* ---------- Styles (copied pattern from Alerts) ---------- */

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.BACK,
      paddingHorizontal: 16,
      paddingTop: Platform.select({ ios: 4, android: 10 }),
    },
    title: {
      fontSize: 32,
      fontWeight: "900",
      color: colors.DARK,
      marginTop: 14,
      marginBottom: 8,
      paddingHorizontal: 8,
    },
    quickRow: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "space-between",
      marginTop: 6,
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.DARK,
      marginBottom: 10,
      marginTop: 6,
      paddingHorizontal: 8,
    },
    listContent: { paddingBottom: 90, paddingHorizontal: 8 },
    bottomBarWrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
  });
