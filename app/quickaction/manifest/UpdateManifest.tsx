import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../../../components/header";
import BottomBar from "../../../components/bottombar";
import { useTheme, COLORS } from "../../../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE_URL = "https://stagingapi.binarytech.io";
type Option = { label: string; value: string };

const InfoDot = () => (
  <Ionicons name="information-circle-outline" size={14} style={{ marginLeft: 6, opacity: 0.6 }} />
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={{ fontSize: 12.5, fontWeight: "700", opacity: 0.9 }}>{children}</Text>
);

const SimpleSelect: React.FC<{
  value: string | null;
  placeholder?: string;
  options: Option[];
  onChange: (v: string) => void;
  rightAdornment?: React.ReactNode;
}> = ({ value, placeholder = "Select...", options, onChange, rightAdornment }) => {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const triggerRef = useRef<View>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      setTimeout(() => {
        triggerRef.current?.measureInWindow((x, y, w, h) => setAnchor({ x, y, w, h }));
      }, 0);
    }
  }, [open]);

  const selectedLabel = value ? options.find((o) => o.value === value)?.label : null;

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          baseStyles.input,
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff",
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text style={{ flex: 1, color: selectedLabel ? "#111" : "#777" }}>
          {selectedLabel ?? placeholder}
        </Text>
        {rightAdornment ?? <MaterialIcons name="expand-more" size={20} />}
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        {anchor && (
          <View
            style={{
              position: "absolute",
              top: anchor.y + anchor.h + 4,
              left: Math.max(8, anchor.x),
              width: Math.min(anchor.w, Dimensions.get("window").width - 16),
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#E1DFD6",
              borderRadius: 10,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
              overflow: "hidden",
            }}
          >
            <ScrollView style={{ maxHeight: 220 }}>
              {options.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: pressed ? "rgba(0,0,0,0.05)" : "#fff",
                    },
                  ]}
                >
                  <Text>{opt.label}</Text>
                  {value === opt.value && <Ionicons name="checkmark" size={18} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </Modal>
    </>
  );
};

export default function UpdateManifest() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const s = useMemo(() => styles({ colors }), [colors]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tracker, setTracker] = useState<string | null>(null);
  const [startPlace, setStartPlace] = useState<string | null>(null);
  const [startingUser, setStartingUser] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [autoStart, setAutoStart] = useState(false);
  const [targetDestination, setTargetDestination] = useState<string | null>(null);
  const [endingUser, setEndingUser] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [autoEnd, setAutoEnd] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [trackerOptions, setTrackerOptions] = useState<Option[]>([]);
  const [placeOptions, setPlaceOptions] = useState<Option[]>([]);
  const [destinationOptions, setDestinationOptions] = useState<Option[]>([]);
  const [userOptions, setUserOptions] = useState<Option[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem("access_token");
      const orgId = await AsyncStorage.getItem("organisationId");
      if (!token || !orgId || !id) return;

      const headers = {
        Authorization: `Bearer ${token}`,
        OrganisationId: orgId.trim(),
        "Content-Type": "application/json",
      };

      try {
        const [trackerRes, placeRes, userRes, manifestRes] = await Promise.all([
          fetch(`${API_BASE_URL}/v1/trackers?organisationId=${orgId}`, { headers }),
          fetch(`${API_BASE_URL}/v1/places?organisationId=${orgId}`, { headers }),
          fetch(`${API_BASE_URL}/v1/autocomplete/users?organisationId=${orgId}`, { headers }),
          fetch(`${API_BASE_URL}/v1/manifests/${id}`, { headers }),
        ]);

        const trackers = await trackerRes.json();
        const places = await placeRes.json();
        const users = await userRes.json();
        const manifest = await manifestRes.json();

        setTrackerOptions(trackers.map((t: any) => ({ label: t.name ?? `Tracker #${t.id}`, value: String(t.id) })));
        setPlaceOptions(places.map((p: any) => ({ label: p.name, value: String(p.id) })));
        setDestinationOptions(places.map((p: any) => ({ label: p.name, value: String(p.id) })));
        setUserOptions(users.map((u: any) => ({ label: u.name ?? u.email, value: String(u.value) })));

        setName(manifest.name ?? "");
        setDescription(manifest.description ?? "");
        setTracker(manifest.BinaryId ? String(manifest.BinaryId) : null);
        setStartPlace(manifest.startPlaceId ? String(manifest.startPlaceId) : null);
        setTargetDestination(manifest.endPlaceId ? String(manifest.endPlaceId) : null);
        setStartingUser(manifest.startingUserId ? String(manifest.startingUserId) : null);
        setEndingUser(manifest.endingUserId ? String(manifest.endingUserId) : null);
        setStartTime(manifest.startTime ? new Date(manifest.startTime) : null);
        setEndTime(manifest.endTime ? new Date(manifest.endTime) : null);
        setAutoStart(Boolean(manifest.autoStart));
        setAutoEnd(Boolean(manifest.autoEnd));

        setLoadingDropdowns(false);
      } catch (err) {
        console.warn("Fetch error:", err);
      }
    };

    fetchData();
  }, [id]);

  const updateManifest = async () => {
  try {
    const token = await AsyncStorage.getItem("access_token");
    const orgId = await AsyncStorage.getItem("organisationId");
    if (!token || !orgId || !id) throw new Error("Missing credentials or manifest ID");

    // ✅ Validate required fields
    if (!name || !tracker) {
      Alert.alert("Missing required fields", "Name and Tracker are required.");
      return;
    }

    if (autoStart && (!startPlace || !startTime || !startingUser)) {
      Alert.alert("Missing Auto Start fields", "Please fill out Start Place, Start Time, and Starting User.");
      return;
    }

    if (autoEnd && (!targetDestination || !endTime || !endingUser)) {
      Alert.alert("Missing Auto End fields", "Please fill out Target Destination, End Time, and Ending User.");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      OrganisationId: orgId.trim(),
      "Content-Type": "application/json",
    };

    const payload: Record<string, any> = {
      Id: Number(id),
      BinaryId: tracker,
      Name: name,
      Description: description,
      AutoStart: autoStart,
      AutoEnd: autoEnd,
    };

    if (autoStart) {
      payload.StartTime = startTime?.toISOString();
      payload.StartPlaceId = Number(startPlace);
      payload.StartingUserId = startingUser;
      payload.TargetPlaceId = Number(startPlace);
      payload.Status = "Start";
    }

    if (autoEnd) {
      payload.EndTime = endTime?.toISOString();
      payload.EndPlaceId = Number(targetDestination);
      payload.EndingUserId = endingUser;
    }

    const res = await fetch(`${API_BASE_URL}/v1/manifests/UpdateManifest`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    const resultText = await res.text();
    if (!res.ok) throw new Error(resultText || "Update failed");

    Alert.alert("Success", `Manifest ${id} updated.`);
    router.replace(`/manifest?id=${id}`);
  } catch (err: any) {
    Alert.alert("Error", err.message ?? "Unknown error occurred.");
  }
};
    if (loadingDropdowns) {
    return (
      <SafeAreaView style={s.safe}>
        <AppHeader
          onAvatarPress={() => router.push("/profile")}
          showBack
          />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.PURPLE} />
          <Text style={{ marginTop: 12, color: "#777" }}>Loading manifest data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader
        onAvatarPress={() => router.push("/profile")}
        showBack
        />
      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.body, { paddingBottom: 120 }]} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Update Manifest</Text>

          <View style={s.card}>
            {/* Tracker */}
            <View style={s.fieldRow}>
              <FieldLabel>Tracker <InfoDot /></FieldLabel>
              <SimpleSelect value={tracker} options={trackerOptions} onChange={setTracker} />
            </View>

            {/* Name */}
            <View style={s.fieldRow}>
              <FieldLabel>Name <InfoDot /></FieldLabel>
              <TextInput value={name} onChangeText={setName} placeholder="Enter name..." style={s.input} />
            </View>

            {/* Description */}
            <View style={s.fieldRow}>
              <FieldLabel>Description <InfoDot /></FieldLabel>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add short description..."
                style={[s.input, { height: 92, textAlignVertical: "top" }]}
                multiline
              />
            </View>

            {/* Auto Start Toggle */}
            <View style={s.fieldRow}>
              <FieldLabel>Auto Start <InfoDot /></FieldLabel>
              <View style={s.checkboxRow}>
                <Pressable
                  onPress={() => setAutoStart(!autoStart)}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: autoStart }}
                >
                  <Ionicons
                    name={autoStart ? "checkbox" : "square-outline"}
                    size={22}
                    color={autoStart ? COLORS.PURPLE : "#333"}
                  />
                </Pressable>
                <Text style={s.checkboxLabel}>Enable Auto Start</Text>
              </View>
            </View>

            {autoStart && (
              <>
                <View style={s.fieldRow}>
                  <FieldLabel>Start Place <InfoDot /></FieldLabel>
                  <SimpleSelect value={startPlace} options={placeOptions} onChange={setStartPlace} />
                </View>

                <View style={s.fieldRow}>
                  <FieldLabel>Starting User <InfoDot /></FieldLabel>
                  <SimpleSelect value={startingUser} options={userOptions} onChange={setStartingUser} />
                </View>

                <View style={s.fieldRow}>
                  <FieldLabel>Start Time <InfoDot /></FieldLabel>
                  <Pressable onPress={() => setShowStartPicker(true)} style={s.input}>
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                      <Text style={{ flex: 1, color: startTime ? "#111" : "#777" }}>
                        {startTime ? startTime.toLocaleString() : "Select..."}
                      </Text>
                      <Ionicons name="calendar-outline" size={18} color="#555" />
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
                </View>
              </>
            )}

            {/* Auto End Toggle */}
            <View style={s.fieldRow}>
              <FieldLabel>Auto End <InfoDot /></FieldLabel>
              <View style={s.checkboxRow}>
                <Pressable
                  onPress={() => setAutoEnd(!autoEnd)}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: autoEnd }}
                >
                  <Ionicons
                    name={autoEnd ? "checkbox" : "square-outline"}
                    size={22}
                    color={autoEnd ? COLORS.PURPLE : "#333"}
                  />
                </Pressable>
                <Text style={s.checkboxLabel}>Enable Auto End</Text>
              </View>
            </View>

            {autoEnd && (
              <>
                <View style={s.fieldRow}>
                  <FieldLabel>Target Destination <InfoDot /></FieldLabel>
                  <SimpleSelect value={targetDestination} options={destinationOptions} onChange={setTargetDestination} />
                </View>

                <View style={s.fieldRow}>
                  <FieldLabel>Ending User <InfoDot /></FieldLabel>
                  <SimpleSelect value={endingUser} options={userOptions} onChange={setEndingUser} />
                </View>

                <View style={s.fieldRow}>
                  <FieldLabel>End Time <InfoDot /></FieldLabel>
                  <Pressable onPress={() => setShowEndPicker(true)} style={s.input}>
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                      <Text style={{ flex: 1, color: endTime ? "#111" : "#777" }}>
                        {endTime ? endTime.toLocaleString() : "Select..."}
                      </Text>
                      <Ionicons name="calendar-outline" size={18} color="#555" />
                    </View>
                  </Pressable>
                  {showEndPicker && (
                    <DateTimePicker
                      value={endTime || new Date()}
                      onChange={(_, d) => {
                        setShowEndPicker(false);
                        if (d) setEndTime(d);
                      }}
                      mode="time"
                    />
                  )}
                </View>
              </>
            )}

            {/* Action Buttons */}
            <View style={s.actionsRow}>
              <Pressable
                onPress={async () => {
                  await updateManifest(); // ensures update completes
                  router.replace(`/quickaction/ManifestPage?id=${id}`); // navigates to updated manifest
                }}
                style={s.primaryBtn}
              >
                <Text style={s.primaryBtnText}>Update</Text>
              </Pressable>
              <Pressable onPress={() => router.back()} style={s.secondaryBtn}>
                <Text style={s.secondaryBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
}
const baseStyles = StyleSheet.create({
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E1DFD6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});

type StyleArgs = { colors?: any };
const styles = (args?: StyleArgs) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: args?.colors?.background ?? "#FFFFFF" },
    body: { paddingHorizontal: 16 },
    title: {
      fontSize: 26,
      fontWeight: "800",
      marginVertical: 12,
      alignSelf: "center",
    },
    card: {
      backgroundColor: args?.colors?.card ?? "#FFFFFF",
      borderRadius: 14,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: args?.colors?.border ?? "#E6E1D6",
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fieldRow: { marginBottom: 14 },
  input: baseStyles.input,
  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 28 },
  checkboxLabel: { marginLeft: 10, fontSize: 13, fontWeight: "600", color: "#333" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    marginHorizontal: -6,
  },
  primaryBtn: {
    backgroundColor: args?.colors?.primary ?? "#7A4AA8",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: args?.colors?.primary ?? "#7A4AA8",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  secondaryBtnText: {
    color: args?.colors?.primary ?? "#7A4AA8",
    fontWeight: "700",
    fontSize: 16,
  },
  bottomBarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});