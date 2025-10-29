// app/manifest/create.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import BottomBar from "../../components/bottombar";
import AppHeader from "../../components/header";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../constants/theme"; 

// ---------- Tiny helpers ----------
type Option = { label: string; value: string };
const API_BASE_URL = "https://stagingapi.binarytech.io";

const InfoDot = () => (
  <Ionicons
    name="information-circle-outline"
    size={14}
    style={{ marginLeft: 6, opacity: 0.6 }}
  />
);

const FieldLabel: React.FC<{ children: React.ReactNode; style?: any }> = ({
  children,
  style,
}) => {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        { fontSize: 12.5, fontWeight: "700", color: colors.TEXT, opacity: 0.9 },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const SimpleSelect: React.FC<{
  value: string | null;
  placeholder?: string;
  options: Option[];
  onChange: (v: string) => void;
  rightAdornment?: React.ReactNode;
}> = ({ value, placeholder = "Select...", options, onChange, rightAdornment }) => {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] =
    useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const triggerRef = useRef<View>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      setTimeout(() => {
        triggerRef.current?.measureInWindow((x, y, w, h) =>
          setAnchor({ x, y, w, h })
        );
      }, 0);
    }
  }, [open]);

  const selectedLabel = value
    ? options.find((o) => o.value === value)?.label
    : null;

  const inputBackground = isDark ? colors.INPUT : "#fff";
  const modalBackground = isDark ? colors.CARD : "#fff";
  const pressedBackground = isDark ? colors.MUTED : "rgba(0,0,0,0.05)";

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: inputBackground,
            borderColor: colors.MUTED,
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 14,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text
          style={{
            flex: 1,
            color: selectedLabel ? colors.TEXT : colors.PLACEHOLDER,
          }}
        >
          {selectedLabel ?? placeholder}
        </Text>
        {rightAdornment ?? (
          <MaterialIcons name="expand-more" size={20} color={colors.TEXT} />
        )}
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />

        {anchor && (
          <View
            style={{
              position: "absolute",
              top: anchor.y + anchor.h + 4,
              left: Math.max(8, anchor.x),
              width: Math.min(anchor.w, Dimensions.get("window").width - 16),
              backgroundColor: isDark ? colors.CARD : "#fff",
              borderWidth: 1,
              borderColor: colors.MUTED,
              borderRadius: 12,
              paddingVertical: 4,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
              overflow: "hidden",
            }}
          >
            <ScrollView style={{ maxHeight: 220 }}>
              {options.map((opt, index) => (
                <Pressable
                  key={opt.value ?? `opt-${index}`}
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
                      backgroundColor: pressed ? pressedBackground : modalBackground,
                    },
                  ]}
                >
                  <Text style={{ color: colors.TEXT }}>{opt.label}</Text>
                  {value === opt.value && (
                    <Ionicons name="checkmark" size={18} color={colors.TEXT} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </Modal>
    </>
  );
};

// ---------- Screen ----------
export default function CreateManifest() {
  const { colors, isDark } = useTheme();
  const s = useMemo(() => styles({ colors, isDark }), [colors, isDark]);
  useMemo(() => baseStyles({ colors, isDark }), [colors, isDark]); 

  const isNarrow = Dimensions.get("window").width < 380;

  // Camera
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedLock, setScannedLock] = useState(false);
  const [createdManifestId, setCreatedManifestId] = useState<string | null>(null);

  // Form state
  const [tracker, setTracker] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [startPlace, setStartPlace] = useState<string | null>(null);
  const [startingUser, setStartingUser] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [autoStart, setAutoStart] = useState(false);

  const [targetDestination, setTargetDestination] = useState<string | null>(null);
  const [endingUser, setEndingUser] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [autoEnd, setAutoEnd] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [showAutoStartModal, setShowAutoStartModal] = useState(false);
  const [showAutoEndModal, setShowAutoEndModal] = useState(false);

  // dropdowns
  const [trackerOptions, setTrackerOptions] = useState<Option[]>([]);
  const [placeOptions, setPlaceOptions] = useState<Option[]>([]);
  const [destinationOptions, setDestinationOptions] = useState<Option[]>([]);
  const [userOptions, setUserOptions] = useState<Option[]>([]);
  const startingUserLabel =
    userOptions.find((u) => u.value === startingUser)?.label ?? "";
  const endingUserLabel =
    userOptions.find((u) => u.value === endingUser)?.label ?? "";

  useEffect(() => {
    console.log("StartTime updated:", startTime?.toLocaleString());
  }, [startTime]);

  useEffect(() => {
    const loadDropdownData = async () => {
      const token = await AsyncStorage.getItem("access_token");
      const orgId = await AsyncStorage.getItem("organisationId");

      if (!token || !orgId) return;

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        const [trackerRes, placeRes] = await Promise.all([
          fetch(
            `${API_BASE_URL}/v1/trackers?organisationId=${orgId.trim()}`,
            { headers }
          ),
          fetch(
            `${API_BASE_URL}/v1/places?organisationId=${orgId.trim()}`,
            { headers }
          ),
        ]);

        const trackerData = await trackerRes.json();
        const placeData = await placeRes.json();

        setTrackerOptions(
          trackerData.map((t: any) => ({
            label: `Tracker #${t.id}`,
            value: String(t.id),
          }))
        );

        setPlaceOptions(
          placeData.map((p: any) => ({
            label: p.name,
            value: String(p.id),
          }))
        );

        setDestinationOptions(
          placeData.map((p: any) => ({
            label: p.name,
            value: String(p.id),
          }))
        );

        const userRes = await fetch(
          `${API_BASE_URL}/v1/autocomplete/users?organisationId=${orgId.trim()}`,
          { headers }
        );

        const userData = await userRes.json();
        console.log("Raw user response:", userData);

        if (!Array.isArray(userData)) {
          console.warn("Unexpected user response:", userData);
          return;
        }

        setUserOptions(
          userData
            .filter((u: any) => u.value && u.name)
            .map((u: any) => ({
              label: u.name,
              value: String(u.value),
            }))
        );
      } catch (err) {
        console.warn("Failed to load dropdown data:", err);
      }
    };

    loadDropdownData();
  }, []);

  const buildHeaders = async () => {
    const token = await AsyncStorage.getItem("access_token");
    const orgId = await AsyncStorage.getItem("organisationId");

    if (!token || !orgId) {
      throw new Error("Missing token or organisationId");
    }

    return {
      Authorization: `Bearer ${token}`,
      OrganisationId: orgId.trim(),
      "Content-Type": "application/json",
    };
  };

  const onCreate = async () => {
    try {
      const headers = await buildHeaders();
      const orgId = await AsyncStorage.getItem("organisationId");
      if (!orgId) throw new Error("Missing organisationId");

      const payload: Record<string, any> = {
        OrganisationId: orgId.trim(),
        BinaryId: tracker?.toString().trim(),
        Name: name,
        Description: description,
      };

      // Auto Start
      if (autoStart && startPlace && startingUser && startTime instanceof Date) {
        payload.AutoStart = true;
        payload.StartPlaceId = Number(startPlace);
        payload.StartingUserId = startingUser;
        payload.StartTime = startTime.toISOString();
        payload.TargetPlaceId = Number(startPlace);
      }

      // Auto End
      if (autoEnd && targetDestination && endingUser && deadline instanceof Date) {
        payload.AutoEnd = true;
        payload.EndTime = deadline.toISOString();
        payload.DeadlineTime = deadline.toISOString();
        payload.EndPlaceId = Number(targetDestination);
        payload.EndUserId = endingUser;
      }

      console.log("Creating manifest with payload:", payload);

      const response = await fetch(`${API_BASE_URL}/v1/manifests`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");
      const result = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const errorMessage =
          typeof result === "string"
            ? result
            : result?.message || JSON.stringify(result) || "Failed to create manifest.";
        throw new Error(errorMessage);
      }

      const manifestId = String((result as any)?.id ?? (result as any)?.Id);
      if (!manifestId || isNaN(Number(manifestId))) {
        throw new Error("Manifest ID missing or invalid.");
      }

      setCreatedManifestId(manifestId);

      Alert.alert("Success", `Manifest ${manifestId} created!`);
      router.replace(`/quickaction/ManifestPage?id=${manifestId}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong.");
    }
  };

  // Scan button handler
  const openScanner = async () => {
    if (!permission || !permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setScannedLock(false);
    setScannerOpen(true);
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scannedLock) return;
    setScannedLock(true);
    const value = result.data?.toString?.() ?? "";
    setTracker(value);
    setTimeout(() => setScannerOpen(false), 200);
  };

  // Header props
  const [notifications] = useState<string[]>([]);
  const onAvatarPress = () => router.push("/profile");

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader onAvatarPress={() => router.push("/profile")} showBack />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.body, { paddingBottom: 120 }]}
          keyboardShouldPersistTaps="handled"
        >
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
              New Manifest
            </Text>
            <View style={s.headerRightStub} />
          </View>

          <View style={s.card}>
            {/* Tracker with Scan button */}
            <View style={s.fieldRow}>
              <FieldLabel>
                Tracker <InfoDot />
              </FieldLabel>

              <View style={s.inline}>
                <View style={{ flex: 1 }}>
                  <SimpleSelect
                    value={tracker}
                    options={trackerOptions}
                    onChange={setTracker}
                    rightAdornment={
                      <View style={s.inputRight}>
                        <View style={s.divider} />
                        <MaterialIcons
                          name="expand-more"
                          size={20}
                          color={colors.TEXT}
                        />
                      </View>
                    }
                  />
                </View>

                <Pressable onPress={openScanner} style={s.qrBtn} hitSlop={8}>
                  <Ionicons name="qr-code-outline" size={20} color={colors.TEXT} />
                </Pressable>
              </View>
            </View>

            {/* Name */}
            <View style={s.fieldRow}>
              <FieldLabel>
                Name <InfoDot />
              </FieldLabel>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter name..."
                placeholderTextColor={colors.PLACEHOLDER}
                style={[s.input, { color: colors.TEXT }]}
                returnKeyType="done"
              />
            </View>

            {/* Description */}
            <View style={s.fieldRow}>
              <FieldLabel>
                Description <InfoDot />
              </FieldLabel>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add short description..."
                placeholderTextColor={colors.PLACEHOLDER}
                style={[
                  s.input,
                  { height: 92, textAlignVertical: "top", color: colors.TEXT },
                ]}
                multiline
              />
            </View>

            {/* Auto Start Toggle */}
            <View style={s.fieldRow}>
              <FieldLabel>
                Auto Start <InfoDot />
              </FieldLabel>
              <View style={s.checkboxRow}>
                <Pressable
                  onPress={() => {
                    const next = !autoStart;
                    setAutoStart(next);
                    if (next) setShowAutoStartModal(true);
                  }}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: autoStart }}
                >
                  <Ionicons
                    name={autoStart ? "checkbox" : "square-outline"}
                    size={22}
                    color={autoStart ? colors.PURPLE : colors.TEXT}
                  />
                </Pressable>
                <Text style={s.checkboxLabel}>Enable Auto Start</Text>
                <InfoDot />
              </View>
            </View>

            {/* Auto End Toggle */}
            <View style={s.fieldRow}>
              <FieldLabel>
                Auto End <InfoDot />
              </FieldLabel>
              <View style={s.checkboxRow}>
                <Pressable
                  onPress={() => {
                    const next = !autoEnd;
                    setAutoEnd(next);
                    if (next) setShowAutoEndModal(true);
                  }}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: autoEnd }}
                >
                  <Ionicons
                    name={autoEnd ? "checkbox" : "square-outline"}
                    size={22}
                    color={autoEnd ? colors.PURPLE : colors.TEXT}
                  />
                </Pressable>
                <Text style={s.checkboxLabel}>Enable Auto End</Text>
                <InfoDot />
              </View>
            </View>

            {/* Actions */}
            <View style={s.actionsRow}>
              <Pressable
                accessibilityRole="button"
                onPress={onCreate}
                style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={s.primaryBtnText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>

      {/* Scanner Modal */}
      <Modal
        visible={scannerOpen}
        animationType="slide"
        onRequestClose={() => setScannerOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 12 }}>
            <Pressable onPress={() => setScannerOpen(false)} hitSlop={8}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </Pressable>
            <Text
              style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 6 }}
            >
              Scan Tracker QR
            </Text>
          </View>

          {permission?.granted ? (
            <View style={{ flex: 1 }}>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "code128", "code39", "ean13", "ean8", "upc_a", "upc_e"],
                }}
                onBarcodeScanned={(e) => onBarcodeScanned(e)}
              />
              {/* Simple scan frame overlay */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: "25%",
                  left: "10%",
                  right: "10%",
                  height: "35%",
                  borderWidth: 2,
                  borderColor: "#fff",
                  borderRadius: 12,
                }}
              />
            </View>
          ) : (
            <View
              style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}
            >
              <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
                Camera permission is required to scan a tracker.
              </Text>
              <Pressable onPress={requestPermission} style={[s.primaryBtn, { marginTop: 16 }]}>
                <Text style={s.primaryBtnText}>Grant Permission</Text>
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Auto Start Modal */}
      <Modal visible={showAutoStartModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.BACK, padding: 16 }}>
          <Text
            style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: colors.TEXT }}
          >
            Auto-Start Settings
          </Text>

          {/* Start Place */}
          <FieldLabel>
            Start Place <InfoDot />
          </FieldLabel>
          <SimpleSelect
            value={startPlace}
            options={placeOptions}
            onChange={setStartPlace}
            placeholder="Select start place..."
          />

          {/* Starting User */}
          <FieldLabel style={{ marginTop: 12 }}>
            Starting User <InfoDot />
          </FieldLabel>
          <SimpleSelect
            value={startingUser}
            options={userOptions}
            onChange={setStartingUser}
            placeholder="Select starting user..."
          />

          {/* Start Time */}
          <FieldLabel style={{ marginTop: 12 }}>
            Start Time <InfoDot />
          </FieldLabel>
          <Pressable
            onPress={() => setShowStartPicker(true)}
            style={[
              s.input,
              {
                backgroundColor: isDark ? colors.INPUT : "#fff",
                borderColor: colors.MUTED,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
          >
            <Text style={{ flex: 1, color: startTime ? colors.TEXT : colors.PLACEHOLDER }}>
              {startTime ? startTime.toLocaleString() : "Select..."}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={colors.TEXT} />
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

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 24 }}>
            <Pressable
              onPress={() => {
                setAutoStart(false);
                setShowAutoStartModal(false);
                setStartPlace(null);
                setStartingUser(null);
                setStartTime(null);
              }}
              style={s.secondaryBtn}
            >
              <Text style={s.secondaryBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!startPlace || !startingUser || !startTime) {
                  Alert.alert("Missing Fields", "Please fill out all Auto-Start fields.");
                  return;
                }
                setShowAutoStartModal(false);
              }}
              style={s.primaryBtn}
            >
              <Text style={s.primaryBtnText}>Confirm</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Auto End Modal */}
      <Modal visible={showAutoEndModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.BACK, padding: 16 }}>
          <Text
            style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: colors.TEXT }}
          >
            Auto-End Settings
          </Text>

          {/* Target Destination */}
          <FieldLabel>
            Target Destination <InfoDot />
          </FieldLabel>
          <SimpleSelect
            value={targetDestination}
            options={destinationOptions}
            onChange={setTargetDestination}
            placeholder="Select destination..."
          />

          {/* Ending User */}
          <FieldLabel style={{ marginTop: 12 }}>
            Ending User <InfoDot />
          </FieldLabel>
          <SimpleSelect
            value={endingUser}
            options={userOptions}
            onChange={setEndingUser}
            placeholder="Select ending user..."
          />

          {/* Deadline Time */}
          <FieldLabel style={{ marginTop: 12 }}>
            Deadline <InfoDot />
          </FieldLabel>
          <Pressable
            onPress={() => setShowDeadlinePicker(true)}
            style={[
              s.input,
              {
                backgroundColor: isDark ? colors.INPUT : "#fff",
                borderColor: colors.MUTED,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
          >
            <Text style={{ flex: 1, color: deadline ? colors.TEXT : colors.PLACEHOLDER }}>
              {deadline ? deadline.toLocaleString() : "Select..."}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={colors.TEXT} />
          </Pressable>

          {showDeadlinePicker && (
            <DateTimePicker
              value={deadline || new Date()}
              onChange={(_, d) => {
                setShowDeadlinePicker(false);
                if (d) setDeadline(d);
              }}
              mode="time"
            />
          )}

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 24 }}>
            <Pressable
              onPress={() => {
                setAutoEnd(false);
                setShowAutoEndModal(false);
                setTargetDestination(null);
                setEndingUser(null);
                setDeadline(null);
              }}
              style={s.secondaryBtn}
            >
              <Text style={s.secondaryBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!targetDestination || !endingUser || !deadline) {
                  Alert.alert("Missing Fields", "Please fill out all Auto-End fields.");
                  return;
                }
                setShowAutoEndModal(false);
              }}
              style={s.primaryBtn}
            >
              <Text style={s.primaryBtnText}>Confirm</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- Base styles ----------
const baseStyles = ({ colors, isDark }: { colors: any; isDark: boolean }) =>
  StyleSheet.create({
    input: {
      backgroundColor: isDark ? colors.INPUT : "#fff",
      borderWidth: 1,
      borderColor: colors.MUTED,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
    },
  });

// ---------- Styles ----------
const styles = ({ colors, isDark }: { colors: any; isDark: boolean }) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.BACK },
    body: { paddingHorizontal: 16 },

    title: {
      fontSize: 26,
      fontWeight: "800",
      marginVertical: 12,
      alignSelf: "center",
      color: colors.TEXT,
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

    card: {
      backgroundColor: isDark ? colors.CARD : "#fff",
      borderRadius: 14,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.MUTED,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },

    fieldRow: { marginBottom: 14 },
    row: { marginBottom: 14, marginHorizontal: -6 },
    col: { flex: 1, paddingHorizontal: 6 },

    input: baseStyles({ colors, isDark }).input,

    inline: { flexDirection: "row", alignItems: "center", gap: 10 },
    inputRight: { flexDirection: "row", alignItems: "center" },

    divider: {
      width: 1,
      height: 18,
      backgroundColor: colors.MUTED,
      marginRight: 10,
    },

    qrBtn: {
      height: 44,
      width: 44,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? colors.INPUT : "#fff",
      borderWidth: 1,
      borderColor: colors.MUTED,
    },

    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 28,
    },
    checkboxLabel: {
      marginLeft: 10,
      fontSize: 13,
      fontWeight: "600",
      color: colors.TEXT,
    },

    actionsRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 8,
      marginHorizontal: -6,
    },

    primaryBtn: {
      backgroundColor: colors.PURPLE,
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
      backgroundColor: isDark ? colors.INPUT : "#fff",
      borderWidth: 1.5,
      borderColor: colors.PURPLE,
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 12,
      marginHorizontal: 6,
    },
    secondaryBtnText: {
      color: colors.PURPLE,
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
