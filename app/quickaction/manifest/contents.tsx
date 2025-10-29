import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import uuid from "react-native-uuid";
import BottomBar from "../../../components/bottombar";
import AppHeader from "../../../components/header";
import SimpleSelect from "../../../components/select";
import { useTheme } from "../../../constants/theme";

type Option = { label: string; value: string };

const ManifestContents = () => {
  const rawParams = useLocalSearchParams();
  const manifestId = typeof rawParams.id === "string" ? rawParams.id : Array.isArray(rawParams.id) ? rawParams.id[0] : "";
  const manifestParamName = typeof rawParams.name === "string" ? rawParams.name : Array.isArray(rawParams.name) ? rawParams.name[0] : "";

  const { colors, isDark } = useTheme();
  const s = styles({ colors, isDark });

  const [manifestName, setManifestName] = useState<string | null>(null);
  const [manifestStatus, setManifestStatus] = useState<string | null>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [placeOptions, setPlaceOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [newContent, setNewContent] = useState({
    identifier: "",
    name: "",
    description: "",
    placeAdded: "",
    contentTags: [] as string[],
  });

  const fetchData = async () => {
    const token = await AsyncStorage.getItem("access_token");
    const orgId = await AsyncStorage.getItem("organisationId");
    if (!token || !orgId || !manifestId) return;

    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        OrganisationId: orgId.trim(),
      };

      // Manifest details
      const manifestRes = await fetch(`https://stagingapi.binarytech.io/v1/manifests/${manifestId}`, { headers });
      const manifest = await manifestRes.json();
      setManifestName(manifest?.name ?? manifestParamName ?? `Manifest ${manifestId}`);
      setManifestStatus(manifest?.status ?? null);

      // Contents (use proper OData filter and encode)
      const filter = encodeURIComponent(`ManifestId eq ${Number(manifestId)}`);
      const contentsRes = await fetch(`https://stagingapi.binarytech.io/v1/contents?$filter=${filter}`, { headers });
      const contentsData = await contentsRes.json();
      setContents(Array.isArray(contentsData?.value) ? contentsData.value : Array.isArray(contentsData) ? contentsData : []);

      // Places
      const placesRes = await fetch(`https://stagingapi.binarytech.io/v1/places?organisationId=${encodeURIComponent(orgId)}&$top=100`, { headers });
      const placesData = await placesRes.json();
      const placesArray = Array.isArray(placesData?.value) ? placesData.value : Array.isArray(placesData) ? placesData : [];
      const opts = placesArray.map((p: any) => ({
        label: p.name ?? `Place ${p.id}`,
        value: String(p.id),
      }));
      setPlaceOptions(opts);
    } catch (err) {
      Alert.alert("Error", "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (manifestId) fetchData();
  }, [manifestId]);

  const handleAddContent = async () => {
    const token = await AsyncStorage.getItem("access_token");
    const orgId = await AsyncStorage.getItem("organisationId");
    if (!token || !orgId || !manifestId) {
      Alert.alert("Error", "Missing token, organisation ID, or manifest ID.");
      return;
    }

    // Prevent adding to finished/closed manifest
    try {
      const res = await fetch(`https://stagingapi.binarytech.io/v1/manifests/${manifestId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          OrganisationId: orgId.trim(),
        },
      });
      const manifest = await res.json();
      const status = manifest?.status ?? "";
      const normalized = status.toLowerCase().trim();
      const closedStatuses = ["finished", "closed", "ended"];
      const isClosedStatus = closedStatuses.some((s) => normalized.includes(s));

      const now = Date.now();
      const endTime = manifest?.endTime ? new Date(manifest.endTime).getTime() : null;
      const isPastEndTime = endTime !== null && now > endTime;

      if (isClosedStatus || isPastEndTime) {
        Alert.alert("Error", "Cannot add contents to a finished manifest.");
        return;
      }
    } catch {
      Alert.alert("Error", "Failed to validate manifest state.");
      return;
    }

    const { identifier, name, description, placeAdded, contentTags } = newContent;

    if (!identifier.trim() || !name.trim() || !placeAdded || isNaN(Number(placeAdded))) {
      Alert.alert("Missing Fields", "Please fill in Identifier, Name, and select a valid Place.");
      return;
    }

    // Ensure UUID is a string
    const gen = uuid.v4();
    const contentId = typeof gen === "string" ? gen : Array.isArray(gen) ? gen.join("") : String(gen);

    const payload = {
      OrganisationId: orgId.trim(),
      ManifestId: Number(manifestId),
      Contents: [
        {
          Id: contentId,
          ManifestId: Number(manifestId),
          Identifier: identifier.trim(),
          Name: name.trim(),
          Description: description?.trim() ?? "",
          PlaceAdded: Number(placeAdded),
          ContentTags: (contentTags ?? []).filter(Boolean),
        },
      ],
    };

    try {
      const res = await fetch("https://stagingapi.binarytech.io/v1/contents/addContents", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          OrganisationId: orgId.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      const responseBody = contentType?.includes("application/json") ? await res.json() : await res.text();

      if (!res.ok) {
        const errorMessage =
          typeof responseBody === "string"
            ? responseBody
            : responseBody?.message || JSON.stringify(responseBody) || "Unknown error occurred.";
        throw new Error(errorMessage);
      }

      Alert.alert("Success", "Content added.");
      setAddModalOpen(false);
      setNewContent({ identifier: "", name: "", description: "", placeAdded: "", contentTags: [] });
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong.");
    }
  };

  const removeContent = async (contentId: string, placeRemovedId: number) => {
    const token = await AsyncStorage.getItem("access_token");
    const orgId = await AsyncStorage.getItem("organisationId");
    if (!token || !orgId) return;

    const payload = [{ Id: contentId, PlaceRemovedId: Number(placeRemovedId) }];

    try {
      const res = await fetch("https://stagingapi.binarytech.io/v1/contents/remove", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          OrganisationId: orgId.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      Alert.alert("Removed", "Content successfully removed.");
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const visibleContents = contents.filter((c) => !c.removed);

  return (
    <>
      <SafeAreaView style={s.safe}>
        <AppHeader onAvatarPress={() => router.push("/profile")} showBack />
        <ScrollView contentContainerStyle={s.body}>
          {/* Local header to match the rest of your screens */}
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
              Contents
            </Text>
            <View style={s.headerRightStub} />
          </View>

          <Text style={s.title}>Contents for {manifestName ?? `Manifest ${manifestId}`}</Text>

          <Pressable onPress={() => setAddModalOpen(true)} style={s.primaryBtn}>
            <Text style={s.primaryBtnText}>+ Add Content</Text>
          </Pressable>

          <Pressable onPress={fetchData} style={[s.primaryBtn, { marginTop: 12 }]}>
            <Text style={s.primaryBtnText}>Refresh Contents</Text>
          </Pressable>

          {loading ? (
            <ActivityIndicator size="large" color={colors.PURPLE} style={{ marginTop: 20 }} />
          ) : visibleContents.length === 0 ? (
            <Text style={{ marginTop: 20, fontSize: 16, color: colors.MUTED, textAlign: "center" }}>
              No contents found for this manifest.
            </Text>
          ) : (
            visibleContents.map((item, idx) => (
              <View key={String(item.id ?? idx)} style={s.row}>
                <Text style={s.label}>Name</Text>
                <Text style={s.value}>{item.name || "—"}</Text>

                <Text style={s.label}>Description</Text>
                <Text style={s.value}>{item.description || "—"}</Text>

                <Text style={s.label}>Tags</Text>
                <Text style={s.value}>
                  {Array.isArray(item.contentTags) && item.contentTags.length > 0
                    ? item.contentTags.map((tag: any) => tag?.name ?? tag).join(", ")
                    : "—"}
                </Text>

                <Text style={s.label}>Date Added</Text>
                <Text style={s.value}>
                  {item.dateAdded ? new Date(item.dateAdded).toLocaleString() : "—"}
                </Text>

                <Text style={s.label}>Place Added</Text>
                <Text style={s.value}>{item.placeAddedName || "—"}</Text>

                <Text style={s.label}>User Added</Text>
                <Text style={s.value}>{item.userAdded || "—"}</Text>

                <Pressable
                  onPress={() => removeContent(String(item.id), Number(item.placeAddedId ?? item.placeAdded))}
                  style={s.secondaryBtn}
                >
                  <Text style={s.secondaryBtnText}>Remove</Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Add Content Modal */}
      <Modal visible={addModalOpen} animationType="slide" onRequestClose={() => setAddModalOpen(false)}>
        <SafeAreaView style={{ flex: 1, padding: 16, backgroundColor: colors.BACK }}>
          <Text style={[s.title, { fontSize: 20, marginBottom: 12 }]}>Add Content</Text>

          <Text style={s.label}>Identifier</Text>
          <TextInput
            value={newContent.identifier}
            onChangeText={(v) => setNewContent({ ...newContent, identifier: v })}
            style={s.input}
            placeholder="e.g. 123456789"
            placeholderTextColor={colors.PLACEHOLDER}
            underlineColorAndroid="transparent"
          />

          <Text style={s.label}>Name</Text>
          <TextInput
            value={newContent.name}
            onChangeText={(v) => setNewContent({ ...newContent, name: v })}
            style={s.input}
            placeholder="e.g. Serum"
            placeholderTextColor={colors.PLACEHOLDER}
            underlineColorAndroid="transparent"
          />

          <Text style={s.label}>Description</Text>
          <TextInput
            value={newContent.description}
            onChangeText={(v) => setNewContent({ ...newContent, description: v })}
            style={[s.input, { height: 80, textAlignVertical: "top" }]}
            multiline
            placeholder="Short description..."
            placeholderTextColor={colors.PLACEHOLDER}
            underlineColorAndroid="transparent"
          />

          <Text style={s.label}>Place Added</Text>
          <SimpleSelect
            value={newContent.placeAdded}
            options={placeOptions}
            onChange={(v) => setNewContent({ ...newContent, placeAdded: v })}
            placeholder="Select place..."
          />

          <Text style={s.label}>Tags (comma-separated)</Text>
          <TextInput
            value={newContent.contentTags.join(", ")}
            onChangeText={(v) =>
              setNewContent({
                ...newContent,
                contentTags: v.split(",").map((t) => t.trim()).filter(Boolean),
              })
            }
            style={s.input}
            placeholder="e.g. Urgent, Pathology"
            placeholderTextColor={colors.PLACEHOLDER}
            underlineColorAndroid="transparent"
          />

          <View style={s.actionsRow}>
            <Pressable onPress={handleAddContent} style={s.primaryBtn}>
              <Text style={s.primaryBtnText}>Add</Text>
            </Pressable>
            <Pressable onPress={() => setAddModalOpen(false)} style={s.secondaryBtn}>
              <Text style={s.secondaryBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Bottom Bar */}
      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>
    </>
  );
};

const styles = ({ colors, isDark }: { colors: any; isDark: boolean }) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.BACK,
    },
    body: {
      padding: 16,
      paddingBottom: 100,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 16,
      textAlign: "center",
      color: colors.TEXT,
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
    row: {
      marginBottom: 18,
      padding: 14,
      borderRadius: 12,
      backgroundColor: isDark ? colors.CARD : "#fff",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? colors.MUTED : "#E1DFD6",
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.TEXT,
      marginTop: 8,
    },
    value: {
      fontSize: 14,
      color: colors.TEXT,
    },
    input: {
      backgroundColor: isDark ? colors.INPUT : "#fff",
      borderWidth: 1,
      borderColor: isDark ? colors.MUTED : "#E1DFD6",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginTop: 6,
      color: colors.TEXT,
    },
    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 24,
    },
    primaryBtn: {
      backgroundColor: colors.PURPLE,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
    },
    primaryBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
      textAlign: "center",
    },
    secondaryBtn: {
      backgroundColor: isDark ? colors.INPUT : "#fff",
      borderWidth: 1.5,
      borderColor: colors.PURPLE,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      marginTop: 12,
    },
    secondaryBtnText: {
      color: colors.PURPLE,
      fontWeight: "700",
      fontSize: 16,
      textAlign: "center",
    },
    bottomBarWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
  });

export default ManifestContents;
