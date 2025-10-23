import { Ionicons } from "@expo/vector-icons";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import BottomBar from "../components/bottombar";
import AppHeader from "../components/header";
import { COLORS } from "../constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import SimpleSelect from "../components/select";

export default function Scanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [manualEntryVisible, setManualEntryVisible] = useState(false);
  const [trackerOptions, setTrackerOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedTracker, setSelectedTracker] = useState("");

  const [notifications] = useState<string[]>([]);
  const onAvatarPress = () => router.push("/profile");

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
      console.warn("Empty tracker response");
      setTrackerOptions([]);
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse tracker response:", err);
      setTrackerOptions([]);
      return;
    }

    const trackers = Array.isArray(data) ? data : [];
    const options = trackers.map((t: any) => ({
      label: t.trackerTypeName
        ? `${t.trackerTypeName} (${t.id})`
        : t.id ?? "Unnamed Tracker",
      value: t.id,
    }));
    setTrackerOptions(options);
  } catch (err) {
    console.error("Failed to fetch trackers:", err);
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
        Alert.alert("No manifests found", `No manifests assigned to tracker ${trackerId}`);
        return;
      }

      router.push({
        pathname: "/scanner/ManifestList",
        params: { trackerId },
      });
    } catch (err: any) {
      console.error("Tracker lookup error:", err);
      Alert.alert("Error", err.message ?? "Unknown error occurred.");
    }
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.permissionText}>Camera access is required to scan.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        onAvatarPress={() => router.push("/profile")}
        showBack
        />

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Scanner</Text>

        {/* Camera */}
        {cameraActive ? (
          <CameraView
            style={styles.camera}
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
          <View style={[styles.camera, styles.cameraPlaceholder]}>
            <Text style={{ color: "#888" }}>Scanner Inactive</Text>
          </View>
        )}

        {/* Toggle button */}
        <TouchableOpacity style={styles.toggleBtn} onPress={() => setCameraActive(v => !v)}>
          <Ionicons
            name={cameraActive ? "camera-reverse-outline" : "camera-outline"}
            size={20}
            color="#fff"
          />
          <Text style={styles.toggleText}>{cameraActive ? "Stop Scanner" : "Start Scanner"}</Text>
        </TouchableOpacity>

        {/* Manual Entry */}
        <TouchableOpacity
          style={styles.manualBtn}
          onPress={() => setManualEntryVisible(v => !v)}
        >
          <Text style={styles.manualText}>Select Tracker Manually</Text>
        </TouchableOpacity>

        {manualEntryVisible && (
          <View style={styles.manualEntry}>
            <Text style={styles.manualText}>Choose Tracker</Text>
            <SimpleSelect
              value={selectedTracker}
              options={trackerOptions}
              onChange={(v) => {
                setSelectedTracker(v);
                handleTrackerId(v);
              }}
              placeholder="Select a tracker..."
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBarWrap}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
}

const BOTTOM_BAR_HEIGHT = 96;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  permissionText: { fontSize: 16, marginBottom: 10 },
  btn: {
    backgroundColor: COLORS.PURPLE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontSize: 16 },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginTop: 30,
    marginBottom: 2,
    alignSelf: "center",
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
  },
  cameraPlaceholder: { backgroundColor: "#eee" },

  toggleBtn: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PURPLE,
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
    backgroundColor: "#f5f7fa",
    borderRadius: 8,
  },
  manualText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.DARK,
  },
  manualEntry: {
    marginTop: 10,
    paddingHorizontal: 16,
  },

  bottomBarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});