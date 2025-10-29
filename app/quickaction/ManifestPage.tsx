// Imports
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../constants/theme";
import BottomBar from "../../components/bottombar";
import AppHeader from "../../components/header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import SimpleSelect from "../../components/select";
import FieldLabel from "../../components/FieldLabel";
import InfoDot from "../../components/InfoDot";

export default function ManifestPage() {
  const { colors, isDark } = useTheme();
  const s = styles(colors, isDark);
  const rawParams = useLocalSearchParams();


  const FieldLabel = ({ children, style }: { children: React.ReactNode; style?: any }) => {
  const { colors } = useTheme();
  return (
    <Text style={[{ fontWeight: "700", fontSize: 16, color: colors.TEXT }, style]}>
      {children}
    </Text>
  );
};


  const id = typeof rawParams.id === "string" ? rawParams.id : Array.isArray(rawParams.id) ? rawParams.id[0] : "";
  const name = typeof rawParams.name === "string" ? rawParams.name : Array.isArray(rawParams.name) ? rawParams.name[0] : "";

  const API_BASE_URL = "https://stagingapi.binarytech.io";
  const [manifestDetails, setManifestDetails] = useState<any>(null);
  const [userOptions, setUserOptions] = useState([]);
  const [placeOptions, setPlaceOptions] = useState([]);

  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const [startPlace, setStartPlace] = useState(null);
  const [startingUser, setStartingUser] = useState(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);

  const [targetDestination, setTargetDestination] = useState(null);
  const [endingUser, setEndingUser] = useState(null);

  const loadManifest = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const orgId = await AsyncStorage.getItem("organisationId");
      if (!token || !orgId || !id) throw new Error("Missing credentials or manifest ID");

      const headers = {
        Authorization: `Bearer ${token}`,
        OrganisationId: orgId.trim(),
        "Content-Type": "application/json",
      };

      const res = await fetch(`${API_BASE_URL}/v1/manifests/${id}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch manifest");

      const manifest = await res.json();
      setManifestDetails(manifest);
    } catch (err) {
      console.error("Failed to load manifest:", err);
    }
  };

  const loadDropdowns = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const orgId = await AsyncStorage.getItem("organisationId");
      const currentUserId = await AsyncStorage.getItem("userId");

      const headers = {
        Authorization: `Bearer ${token}`,
        OrganisationId: orgId.trim(),
      };

      const [userRes, placeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/v1/autocomplete/users?organisationId=${orgId}`, { headers }),
        fetch(`${API_BASE_URL}/v1/autocomplete/places?organisationId=${orgId}`, { headers }),
      ]);

      const users = await userRes.json();
      const places = await placeRes.json();

      setUserOptions(
        users.map((u: any) => ({
          label: u.name ?? u.email ?? `User ${u.id ?? "—"}`,
          value: u.id ?? u.value,
        }))
      );

      setPlaceOptions(
        places.map((p: any) => ({
          label: p.label?.trim() || `Place ${p.value ?? "—"}`,
          value: p.value,
        }))
      );

      const matchedUser = users.find((u: any) => u.id === currentUserId || u.value === currentUserId);
      if (matchedUser) {
        const userId = matchedUser.id ?? matchedUser.value;
        setStartingUser(userId);
        setEndingUser(userId);
      }
    } catch (err) {
      console.error("Dropdown fetch error:", err);
      setUserOptions([]);
      setPlaceOptions([]);
    }
  };

  useEffect(() => {
    if (id) {
      loadManifest();
      loadDropdowns();
    }
  }, [id]);

  const refreshManifest = async () => {
    await loadManifest();
  };

  const getStatusColor = (status: string | undefined): string => {
    const normalized = status?.trim().toLowerCase();
    switch (normalized) {
      case "started, ok":
      case "not started":
        return "#4CAF50";
      default:
        return "#D32F2F";
    }
  };

  const submitStartManifest = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const orgId = await AsyncStorage.getItem("organisationId");

      if (!manifestDetails?.id || !startPlace || !startingUser) {
        throw new Error("Missing required fields to start manifest.");
      }

      const payload = {
        id: manifestDetails.id,
        binaryId: manifestDetails.sensorId ?? manifestDetails.binaryId ?? "A0D6B72C",
        name: manifestDetails.name ?? "Untitled Manifest",
        description: manifestDetails.description ?? "",
        startPlaceId: Number(startPlace),
        startingUserId: startingUser,
        startTime: (startTime ?? new Date()).toISOString(),
        autoEnd: false,
        input: "",
      };

      const headers = {
        Authorization: `Bearer ${token}`,
        OrganisationId: orgId.trim(),
        "Content-Type": "application/json",
      };

      const res = await fetch(`${API_BASE_URL}/v1/manifests/UpdateManifest`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      const result = await res.text();
      if (!res.ok) throw new Error(result || "Failed to start manifest");

      Alert.alert("✅ Manifest Started");
      setShowStartModal(false);
      refreshManifest();
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Unknown error");
    }
  };

const submitEndManifest = async () => {
  try {
    const token = await AsyncStorage.getItem("access_token");
    const orgId = await AsyncStorage.getItem("organisationId");

    if (!token || !orgId || !manifestDetails?.id || !targetDestination || !endingUser) {
      throw new Error("Missing required fields to close manifest.");
    }

    if (manifestDetails.status?.toLowerCase().includes("finished") || manifestDetails.endTime) {
      Alert.alert("Manifest is already closed.");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      OrganisationId: orgId.trim(),
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const query = `manifestId=${manifestDetails.id}&endPlaceId=${targetDestination}&endUserId=${endingUser}`;
    const url = `${API_BASE_URL}/v1/manifests/CloseManifest/?${query}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
    });

    const resultText = await res.text();
    if (!res.ok) throw new Error(resultText || "Failed to close manifest");

    Alert.alert("✅ Manifest Closed");
    setShowEndModal(false);
    refreshManifest();
  } catch (err: any) {
    Alert.alert("Error", err.message ?? "Unknown error");
  }
};




  




  const actions = [
  {
    key: "update",
    label: "Update Information",
    icon: <Feather name="edit" size={34} color={colors.PURPLE} />,
    onPress: () => router.push({ pathname: "/quickaction/manifest/UpdateManifest", params: { id } }),
  },
  {
    key: "contents",
    label: "Contents",
    icon: <Feather name="package" size={34} color={colors.PURPLE} />,
    onPress: () => router.push({ pathname: "/quickaction/manifest/contents", params: { id, name: manifestDetails?.name ?? name } }),
  },
  {
    key: "start",
    label: "Start Manifest",
    icon: <Feather name="play-circle" size={34} color={colors.PURPLE} />,
    onPress: () => setShowStartModal(true),
  },
  {
    key: "end",
    label: "End Manifest",
    icon: <Feather name="stop-circle" size={34} color={colors.PURPLE} />,
    onPress: () => {
      if (manifestDetails?.status?.toLowerCase().includes("finished") || manifestDetails.endTime) {
        Alert.alert("Manifest is already closed.");
      } else {
        setShowEndModal(true);
      }
    },
  },
];

  return (
    <SafeAreaView style={s.container}>
      <AppHeader
  onAvatarPress={() => router.push("/profile")}
  showBack
  />


      <View style={s.titleRow}>
        <Text style={s.title}>{manifestDetails?.name ?? name ?? `Manifest ${id ?? "—"}`}</Text>
        {manifestDetails?.status && (
          <View style={[s.statusBubble, { backgroundColor: getStatusColor(manifestDetails.status) }]}>
            <Text style={s.statusText}>{manifestDetails.status}</Text>
          </View>
        )}
      </View>

      {manifestDetails && (
        <View style={s.metaBlock}>
          <Text style={s.metaText}>🕒 Start Time: {manifestDetails.startTime ? new Date(manifestDetails.startTime).toLocaleString() : "—"}</Text>
          <Text style={s.metaText}>📍 Start Location: {manifestDetails.startPlaceName ?? "—"}</Text>
                    <Text style={s.metaText}>👤 Created By: {manifestDetails.startingUserName ?? "—"}</Text>
          <Text style={s.metaText}>📝 Description: {manifestDetails.description ?? "—"}</Text>
          <Text style={s.metaText}>
            📦 Tracker: {`Tracker ${manifestDetails.trackerId || manifestDetails.sensorId || manifestDetails.BinaryId || "—"}`}
          </Text>
        </View>
      )}

      <View style={s.card}>
        {actions.map((action, idx) => (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            style={({ pressed }) => [
              s.tile,
              idx < 2 && s.tileBottomBorder,
              idx % 2 === 0 && s.tileRightBorder,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            {action.icon}
            <View style={{ height: 8 }} />
            <Text style={s.tileText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>

      {/* Start Manifest Modal */}
      <Modal visible={showStartModal} animationType="slide">
  <SafeAreaView style={{ flex: 1, padding: 16, backgroundColor: colors.BACK }}>
    <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: colors.TEXT }}>
      Start Manifest
    </Text>

    <FieldLabel>Start Place <InfoDot /></FieldLabel>
    <SimpleSelect value={startPlace} options={placeOptions} onChange={setStartPlace} />

    <FieldLabel style={{ marginTop: 12 }}>Starting User <InfoDot /></FieldLabel>
    <SimpleSelect value={startingUser} options={userOptions} onChange={setStartingUser} />

    <FieldLabel style={{ marginTop: 12 }}>Start Time <InfoDot /></FieldLabel>
    <Pressable
      onPress={() => setShowStartPicker(true)}
      style={[
        s.input,
        {
          backgroundColor: isDark ? colors.INPUT : "#fff",
          borderColor: isDark ? colors.MUTED : "#E1DFD6",
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <Text style={{ flex: 1, color: startTime ? colors.TEXT : colors.PLACEHOLDER }}>
          {startTime ? startTime.toLocaleString() : "Select..."}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.TEXT} />
      </View>
    </Pressable>

    {showStartPicker && (
      <DateTimePicker
        value={startTime || new Date()}
        onChange={(_, d) => {
          setShowStartPicker(false);
          if (d) setStartTime(d);
        }}
        mode="time"
      />
    )}

    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 24 }}>
      <Pressable
        onPress={() => {
          setShowStartModal(false);
          setStartPlace(null);
          setStartingUser(null);
          setStartTime(null);
        }}
        style={s.secondaryBtn}
      >
        <Text style={s.secondaryBtnText}>Cancel</Text>
      </Pressable>

      <Pressable onPress={submitStartManifest} style={s.primaryBtn}>
        <Text style={s.primaryBtnText}>Confirm</Text>
      </Pressable>
    </View>
  </SafeAreaView>
</Modal>

      {/* End Manifest Modal */}
      <Modal visible={showEndModal} animationType="slide">
  <SafeAreaView style={{ flex: 1, padding: 16, backgroundColor: colors.BACK }}>
    <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: colors.TEXT }}>
      End Manifest
    </Text>

    <FieldLabel>Target Destination <InfoDot /></FieldLabel>
    <SimpleSelect value={targetDestination} options={placeOptions} onChange={setTargetDestination} />

    <FieldLabel style={{ marginTop: 12 }}>Ending User <InfoDot /></FieldLabel>
    <SimpleSelect value={endingUser} options={userOptions} onChange={setEndingUser} />

    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 24 }}>
      <Pressable
        onPress={() => {
          setShowEndModal(false);
          setTargetDestination(null);
          setEndingUser(null);
        }}
        style={s.secondaryBtn}
      >
        <Text style={s.secondaryBtnText}>Cancel</Text>
      </Pressable>

      <Pressable onPress={submitEndManifest} style={s.primaryBtn}>
        <Text style={s.primaryBtnText}>Confirm</Text>
      </Pressable>
    </View>
  </SafeAreaView>
</Modal>
    </SafeAreaView>
  );
}

const styles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.BACK,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 24,
      marginBottom: 12,
    },
    statusBubble: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 13,
    },
    metaBlock: {
      marginBottom: 20,
      paddingHorizontal: 8,
    },
    metaText: {
      fontSize: 13,
      color: colors.DARK + "AA",
      marginBottom: 4,
    },
    card: {
      width: "90%",
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: colors.DARK + "33",
      borderRadius: 15,
      overflow: "hidden",
      flexDirection: "row",
      flexWrap: "wrap",
      backgroundColor: colors.LAVENDER,
      alignItems: "center",
      alignSelf: "center",
    },
    tile: {
      width: "50%",
      aspectRatio: 1.35,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.LAVENDER,
    },
    tileBottomBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth * 2,
      borderBottomColor: colors.DARK + "33",
    },
    tileRightBorder: {
      borderRightWidth: StyleSheet.hairlineWidth * 2,
      borderRightColor: colors.DARK + "33",
    },
    tileText: {
      textAlign: "center",
      fontSize: 20,
      lineHeight: 20,
      color: colors.TEXT,
      fontWeight: "600",
      paddingHorizontal: 6,
    },
    bottomBarWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
    title: {
      fontSize: 38,
      fontWeight: "800",
      color: colors.TEXT,
      alignSelf: "center",
      flexShrink: 1,
    },

    input: {
      backgroundColor: isDark ? colors.INPUT : "#fff",
      borderWidth: 1,
      borderColor: isDark ? colors.MUTED : "#E1DFD6",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
    },

    primaryBtn: {
      backgroundColor: colors.PURPLE,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 10,
    },
    primaryBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },

    secondaryBtn: {
      backgroundColor: isDark ? colors.INPUT : "#eee",
      borderWidth: 1.5,
      borderColor: colors.PURPLE,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 10,
    },
    secondaryBtnText: {
      color: colors.PURPLE,
      fontWeight: "700",
      fontSize: 16,
    },
  });