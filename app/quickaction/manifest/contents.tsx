import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomBar from "../../../components/bottombar";
import AppHeader from "../../../components/header";
import SimpleSelect from "../../../components/select";
import { useTheme } from "../../../constants/theme";

export default function Scanner() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const s = useMemo(() => styles({ colors, isDark }), [colors, isDark]);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [manualEntryVisible, setManualEntryVisible] = useState(false);
  const [trackerOptions, setTrackerOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedTracker, setSelectedTracker] = useState("");

  useEffect(() => {
    const fetchTrackers = async () => {
      const token = await AsyncStorage.getItem("access_token");
      const orgId = await AsyncStorage.getItem("organisationId");
      if (!token || !orgId) return;

      try {
        const res = await fetch(
          `https://stagingapi.binarytech.io/v1/trackers?organisationId=${orgId}&top=100&orderby=dateCreatedUnix desc`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              OrganisationId: orgId.trim(),
            },
          }
        );

        const text = await res.text();
        if (!text || text.trim() === "") {
          setTrackerOptions([]);
          return;
        }

        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          setTrackerOptions([]);
          return;
        }

        const trackers = Array.isArray(data) ? data : [];
        const options = trackers.map((t: any) => ({
          label: t.trackerTypeName
            ? `${t.trackerTypeName} (${t.id})`
            : String(t.id ?? "Unnamed Tracker"),
          value: String(t.id),
        }));
        setTrackerOptions(options);
      } catch {
        setTrackerOptions([]);
      }
    };

    fetchTrackers();
  }, []);

  const handleTrackerId = async (trackerId: string) => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const orgId = await AsyncStorage.getItem("organisationId");
      if (!token || !orgId) throw new Error("Missing credentials");

      const headers = {
        Authorization: `Bearer ${token}`,
        OrganisationId: orgId.trim(),
      };

      const res = await fetch(
        `https://stagingapi.binarytech.io/v1/manifests?$filter=SensorId eq '${trackerId}'&$orderby=CreatedTime desc&$top=20`,
        { headers }
      );

      if (!res.ok) throw new Error("Failed to fetch manifests for tracker");

      const manifests = await res.json();
      if (!Array.isArray(manifests) || manifests.length === 0) {
        Alert.alert(
          "No manifests found",
          `No manifests assigned to tracker ${trackerId}`
        );
        return;
      }

      router.push({
        pathname: "/scanner/ManifestList",
        params: { trackerId },
      });
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Unknown error occurred.");
    }
  };

  if (!permission) return <View style={s.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.centered}>
        <Text style={[s.permissionText, { color: colors.TEXT }]}>
          Camera access is required to scan.
        </Text>
        <TouchableOpacity style={s.btn} onPress={requestPermission}>
          <Text style={s.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <AppHeader onAvatarPress={() => router.push("/profile")} showBack />

      <ScrollView
        contentContainerStyle={s.scrollBody}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Local header (theme-aware) */}
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
            Scanner
          </Text>
          <View style={{ width: 44, height: 44 }} />
        </View>

        {/* Camera */}
        {cameraActive ? (
          <CameraView
            style={s.camera}
            facing="back"
            onBarcodeScanned={(e: BarcodeScanningResult) => {
              const { data } = e;
              if (data) {
                setCameraActive(false);
                handleTrackerId(data.trim());
              }
            }}
          />
        ) : (
          <View style={[s.camera, s.cameraPlaceholder]}>
            <Text style={{ color: colors.MUTED }}>Scanner Inactive</Text>
          </View>
        )}

        {/* Toggle button */}
        <TouchableOpacity
          style={s.toggleBtn}
          onPress={() => setCameraActive((v) => !v)}
        >
          <Ionicons
            name={cameraActive ? "camera-reverse-outline" : "camera-outline"}
            size={20}
            color="#fff"
          />
          <Text style={s.toggleText}>
            {cameraActive ? "Stop Scanner" : "Start Scanner"}
          </Text>
        </TouchableOpacity>

        {/* Manual Entry */}
        <TouchableOpacity
          style={s.manualBtn}
          onPress={() => setManualEntryVisible((v) => !v)}
        >
          <Text style={s.manualText}>Select Tracker Manually</Text>
        </TouchableOpacity>

        {manualEntryVisible && (
          <View style={s.manualEntry}>
            <Text style={[s.manualText, { marginBottom: 6 }]}>Choose Tracker</Text>
            <SimpleSelect
              value={selectedTracker}
              options={trackerOptions}
              onChange={(v: string | string[]) => {
                // Normalize to a single string for state + navigation
                const id = Array.isArray(v) ? (v[0] ?? "") : v;
                setSelectedTracker(id);
                if (id) handleTrackerId(id);
              }}
              placeholder="Select a tracker..."
            />
          </View>
        )}
      </ScrollView>

      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
}

const BOTTOM_BAR_HEIGHT = 96;

const styles = ({ colors, isDark }: { colors: any; isDark: boolean }) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.BACK },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.BACK,
      paddingHorizontal: 16,
    },
    permissionText: { fontSize: 16, marginBottom: 10 },
    btn: {
      backgroundColor: colors.PURPLE,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    btnText: { color: "#fff", fontSize: 16 },

    title: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.TEXT,
      marginTop: 30,
      marginBottom: 2,
      alignSelf: "center",
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

    scrollBody: {
      paddingHorizontal: 16,
      paddingBottom: BOTTOM_BAR_HEIGHT + 24,
    },

    camera: {
      width: "92%",
      maxWidth: 500,
      aspectRatio: 1,
      marginTop: 10,
      alignSelf: "center",
      borderRadius: 12,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.CARD,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.MUTED,
    },
    cameraPlaceholder: {
      backgroundColor: isDark ? colors.CARD : "#eee",
    },

    toggleBtn: {
      flexDirection: "row",
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.PURPLE,
      paddingHorizontal: 18,
      paddingVertical: 12,
      marginTop: 10,
      marginBottom: 4,
      borderRadius: 8,
    },
    toggleText: { color: "#fff", marginLeft: 8, fontSize: 16 },

    manualBtn: {
      alignSelf: "center",
      marginTop: 12,
      padding: 10,
      backgroundColor: isDark ? colors.INPUT : "#f5f7fa",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.MUTED,
    },
    manualText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.TEXT,
    },
    manualEntry: {
      marginTop: 10,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },

    bottomBarWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
  });
