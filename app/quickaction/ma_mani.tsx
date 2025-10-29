import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomBar from "../../components/bottombar";
import AppHeader from "../../components/header";
import { useTheme } from "../../constants/theme";
import { fetchUserManifests, ManifestItem } from "./manifest-utils";

type Filter = "All" | "Active" | "Done" | "Mine";

// Safe helpers
const normalizeStatus = (s: string = "") => s.toLowerCase().trim();
const baseName = (s?: string) => s?.split(" (")?.[0]?.trim() ?? "";
const baseNameLower = (s?: string) => baseName(s).toLowerCase();

export default function MyManifestsScreen() {
  const { colors } = useTheme();
  const s = styles(colors);

  const [manifests, setManifests] = useState<ManifestItem[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserName = async () => {
      const name = await AsyncStorage.getItem("user_fullName");
      setUserName(name?.toLowerCase().trim() ?? null);
    };
    fetchUserName();
  }, []);

  useEffect(() => {
    const loadManifests = async () => {
      try {
        const data = await fetchUserManifests();
        setManifests(Array.isArray(data) ? data : []);
      } catch {
        setManifests([]);
      }
    };
    loadManifests();
  }, []);

  const sorted = useMemo(
    () =>
      [...manifests].sort(
        (a, b) =>
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
      ),
    [manifests]
  );

  const filtered = useMemo(() => {
    let result = [...sorted];

    const activeSet = new Set([
      "not started",
      "started, ok",
      "started, warning",
      "start",
      "active",
    ]);

    const doneSet = new Set(["ended", "finished, ok", "finished, warning"]);

    if (filter === "Active") {
      result = result.filter((m) => activeSet.has(normalizeStatus(m.status)));
    } else if (filter === "Done") {
      result = result.filter((m) => doneSet.has(normalizeStatus(m.status)));
    } else if (filter === "Mine" && userName) {
      result = result.filter(
        (m) => baseNameLower(m.startingUserName) === userName
      );
    }

    if (searchQuery.trim()) {
      result = result.filter((m) =>
        (m.name ?? "").toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
    }

    return result;
  }, [sorted, filter, searchQuery, userName]);

  const activeCount = manifests.filter((m) =>
    ["not started", "started, ok", "started, warning", "start", "active"].includes(
      normalizeStatus(m.status)
    )
  ).length;

  const doneCount = manifests.filter((m) =>
    ["ended", "finished, ok", "finished, warning"].includes(
      normalizeStatus(m.status)
    )
  ).length;

  const mineCount = manifests.filter(
    (m) => userName && baseNameLower(m.startingUserName) === userName
  ).length;

  return (
    <SafeAreaView style={[s.container, { paddingBottom: 80 }]}>
      <AppHeader onAvatarPress={() => router.push("/profile")} showBack />

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
          My Manifest
        </Text>
        <View style={s.headerRightStub} />
      </View>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search manifests..."
        placeholderTextColor={colors.PLACEHOLDER}
        style={s.searchInput}
        underlineColorAndroid="transparent"
      />

      <View style={s.quickRow}>
        <TabCard
          label="All"
          count={manifests.length}
          selected={filter === "All"}
          onPress={() => setFilter("All")}
        />
        <TabCard
          label="Active"
          count={activeCount}
          selected={filter === "Active"}
          onPress={() => setFilter("Active")}
        />
        <TabCard
          label="Finished"
          count={doneCount}
          selected={filter === "Done"}
          onPress={() => setFilter("Done")}
        />
        <TabCard
          label="My"
          count={mineCount}
          selected={filter === "Mine"}
          onPress={() => setFilter("Mine")}
        />
      </View>

      <Text style={s.sectionTitle}>
        {filter === "All"
          ? "Recent Manifests"
          : filter === "Mine"
          ? "My Manifests"
          : filter === "Done"
          ? "Finished Manifests"
          : filter === "Active"
          ? "Active Manifests"
          : filter}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ManifestRow item={item} colors={colors} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
}

const TabCard = ({
  label,
  count,
  selected,
  onPress,
}: {
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: "23%",
        padding: 10,
        borderRadius: 14,
        backgroundColor: selected ? colors.PURPLE : colors.CARD,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: selected ? colors.LAVENDER : colors.DARK,
        }}
      >
        {count}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: selected ? colors.LAVENDER : colors.DARK,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const ManifestRow = ({ item, colors }: { item: ManifestItem; colors: any }) => {
  const date = new Date(item.dateCreated);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });

  const getStatusColor = (status: string = "") => {
    const normalized = normalizeStatus(status);
    if (["started, ok", "not started", "active", "start"].includes(normalized))
      return "#22C55E";
    if (
      ["started, warning", "finished, warning", "finished, ok", "ended"].includes(
        normalized
      )
    )
      return "#E63946";
    return "#999";
  };

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/quickaction/ManifestPage",
          params: { id: item.id },
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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
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
          <Text style={{ fontSize: 10, fontWeight: "700", color: colors.DARK }}>
            {month.toUpperCase()}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.DARK }}>
            {day}
          </Text>
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.DARK }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.DARK }}>
            {baseName(item.startingUserName) || "—"}
          </Text>
          <Text style={{ fontSize: 12, color: "#555" }}>
            {item.description ?? "No description"}
          </Text>
          <Text style={{ fontSize: 12, color: "#555" }}>
            Tracker #{item.trackerId}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: getStatusColor(item.status),
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>
            {item.status}
          </Text>
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
      fontSize: 32,
      fontWeight: "900",
      color: colors.DARK,
      marginTop: 14,
      marginBottom: 8,
      paddingHorizontal: 8,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 0,
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

    searchInput: {
      backgroundColor: colors.INPUT,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 12,
      color: colors.TEXT,
      fontSize: 14,
    },

    quickRow: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "space-between",
      marginBottom: 16,
      paddingHorizontal: 4,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.DARK,
      marginBottom: 10,
      marginTop: 6,
      paddingHorizontal: 8,
    },

    bottomBarWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
  });
