import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import AppHeader from "../../../components/header";
import BottomBar from "../../../components/bottombar";
import { COLORS, useTheme } from "../../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import SimpleSelect from "../../../components/select";
import { SafeAreaView } from "react-native-safe-area-context";
import uuid from "react-native-uuid";

type Option = { label: string; value: string };

const ManifestContents = () => {
  const rawParams = useLocalSearchParams();
  const id = typeof rawParams.id === "string" ? rawParams.id : Array.isArray(rawParams.id) ? rawParams.id[0] : "";
  const name = typeof rawParams.name === "string" ? rawParams.name : Array.isArray(rawParams.name) ? rawParams.name[0] : "";

  const { colors } = useTheme();
  const s = styles({ colors });

  const [manifestName, setManifestName] = useState<string | null>(null);
  const [manifestStatus, setManifestStatus] = useState<string | null>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [placeOptions, setPlaceOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [tagsInput, setTagsInput] = useState("");

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
    if (!token || !orgId || !id) return;

    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        OrganisationId: orgId.trim(),
      };

      const manifestRes = await fetch(`https://stagingapi.binarytech.io/v1/manifests/${id}`, { headers });
      const manifest = await manifestRes.json();
      setManifestName(manifest?.name ?? name ?? `Manifest ${id}`);
      setManifestStatus(manifest?.status ?? null);

      const contentsRes = await fetch(`https://stagingapi.binarytech.io/v1/contents?filter=ManifestId eq ${id}`, { headers });
      const contentsData = await contentsRes.json();
      setContents(Array.isArray(contentsData.value) ? contentsData.value : contentsData);

      const placesRes = await fetch(`https://stagingapi.binarytech.io/v1/places?organisationId=${orgId}&$top=100`, { headers });
      const placesData = await placesRes.json();
      const places = Array.isArray(placesData.value) ? placesData.value : placesData;
      const opts = places.map((p: any) => ({
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
    if (id) fetchData();
  }, [id]);

  const handleAddContent = async () => {
  const token = await AsyncStorage.getItem("access_token");
  const orgId = await AsyncStorage.getItem("organisationId");
  if (!token || !orgId || !id) {
    Alert.alert("Error", "Missing token, organisation ID, or manifest ID.");
    return;
  }

  try {
    const res = await fetch(`https://stagingapi.binarytech.io/v1/manifests/${id}`, {
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
  } catch (err) {
    Alert.alert("Error", "Failed to validate manifest state.");
    return;
  }

  const { identifier, name, description, placeAdded, contentTags } = newContent;

  if (!identifier.trim() || !name.trim() || !placeAdded || isNaN(Number(placeAdded))) {
    Alert.alert("Missing Fields", "Please fill in Identifier, Name, and select a valid Place.");
    return;
  }

  const payload = {
    OrganisationId: orgId.trim(),
    ManifestId: Number(id),
    Contents: [
      {
        Id: uuid.v4(),
        ManifestId: Number(id),
        Identifier: identifier.trim(),
        Name: name.trim(),
        Description: description?.trim() ?? "",
        PlaceAdded: Number(placeAdded),
        ContentTags: contentTags?.filter(Boolean) ?? [],
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
    setTagsInput("");
    fetchData();
  } catch (err: any) {
    Alert.alert("Error", err.message || "Something went wrong.");
  }
};

  const removeContent = async (contentId: string, placeRemovedId: number) => {
    const token = await AsyncStorage.getItem("access_token");
    const orgId = await AsyncStorage.getItem("organisationId");
    if (!token || !orgId) return;

    const payload = [{ Id: contentId, PlaceRemovedId: placeRemovedId }];

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
        <AppHeader
          onAvatarPress={() => router.push("/profile")}
          showBack
          />
        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.title}>Contents for {manifestName ?? `Manifest ${id}`}</Text>

          <Pressable onPress={() => setAddModalOpen(true)} style={s.primaryBtn}>
            <Text style={s.primaryBtnText}>+ Add Content</Text>
          </Pressable>

          <Pressable onPress={fetchData} style={[s.primaryBtn, { marginTop: 12 }]}>
            <Text style={s.primaryBtnText}>Refresh Contents</Text>
          </Pressable>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.PURPLE} style={{ marginTop: 20 }} />
          ) : visibleContents.length === 0 ? (
            <Text style={{ marginTop: 20, fontSize: 16, color: "#777", textAlign: "center" }}>
              No contents found for this manifest.
            </Text>
          ) : (
            visibleContents.map((item, idx) => (
              <View key={item.id ?? idx} style={s.row}>
                <Text style={s.label}>Name</Text>
                <Text style={s.value}>{item.name || "—"}</Text>

                <Text style={s.label}>Description</Text>
                <Text style={s.value}>{item.description || "—"}</Text>

                <Text style={s.label}>Tags</Text>
                <Text style={s.value}>
                  {Array.isArray(item.contentTags) && item.contentTags.length > 0
                    ? item.contentTags.map((tag: any) => tag.name ?? tag).join(", ")
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
                  onPress={() => removeContent(item.id, item.placeAddedId ?? Number(item.placeAdded))}
                  style={s.secondaryBtn}
                >
                  <Text style={s.secondaryBtnText}>Remove</Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Modal for adding content */}
      <Modal visible={addModalOpen} animationType="slide" onRequestClose={() => setAddModalOpen(false)}>
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>Add Content</Text>

          <Text style={s.label}>Identifier</Text>
          <TextInput
            value={newContent.identifier}
            onChangeText={(v) => setNewContent({ ...newContent, identifier: v })}
            style={s.input}
            placeholder="e.g. 123456789"
          />

          <Text style={s.label}>Name</Text>
          <TextInput
            value={newContent.name}
            onChangeText={(v) => setNewContent({ ...newContent, name: v })}
            style={s.input}
            placeholder="e.g. Serum"
          />

          <Text style={s.label}>Description</Text>
          <TextInput
            value={newContent.description}
            onChangeText={(v) => setNewContent({ ...newContent, description: v })}
            style={[s.input, { height: 80, textAlignVertical: "top" }]}
            multiline
            placeholder="Short description..."
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
                contentTags: v.split(",").map((t) => t.trim()),
              })
            }
            style={s.input}
            placeholder="e.g. Urgent, Pathology"
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

const styles = (args?: { colors?: any }) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: args?.colors?.background ?? "#fff",
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
    },
    row: {
      marginBottom: 18,
      padding: 14,
      borderRadius: 12,
      backgroundColor: "#fff",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "#E1DFD6",
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: "#555",
      marginTop: 8,
    },
    value: {
      fontSize: 14,
      color: "#111",
    },
    input: {
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#E1DFD6",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginTop: 6,
    },
    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 24,
    },
    primaryBtn: {
      backgroundColor: args?.colors?.primary ?? COLORS.PURPLE,
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
      backgroundColor: "#fff",
      borderWidth: 1.5,
      borderColor: args?.colors?.primary ?? COLORS.PURPLE,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      marginTop: 12,
    },
    secondaryBtnText: {
      color: args?.colors?.primary ?? COLORS.PURPLE,
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