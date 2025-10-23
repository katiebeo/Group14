import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useTheme } from "../../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";

import AppHeader from "../../components/header";
import BottomBar from "../../components/bottombar";
import {
  fetchMapTrackers,
  fetchPlaces,
  Tracker,
  Place,
} from "../../src/ManifestMap/helpers";

export default function MapScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => styles({ colors }), [colors]);
  const mapRef = useRef<MapView>(null);

  const [activeTab, setActiveTab] = useState<"trackers" | "places">("trackers");
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Region | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("__all__");
  const [dropdownItems, setDropdownItems] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rawTrackers, rawPlaces] = await Promise.all([
          fetchMapTrackers(),
          fetchPlaces(),
        ]);
        setTrackers(rawTrackers);
        setPlaces(rawPlaces);
      } catch (err) {
        console.error("Error loading map data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (activeTab === "trackers") {
      setDropdownItems([
        { label: "All Trackers", value: "__all__" },
        ...trackers.map((t) => ({
          label: t.id,
          value: t.id,
        })),
      ]);
    } else {
      setDropdownItems([
        { label: "All Places", value: "__all__" },
        ...places.map((p) => ({
          label: `${p.name} (${p.placeType})`,
          value: String(p.id),
        })),
      ]);
    }
  }, [activeTab, trackers, places]);

  const selectedItem = useMemo(() => {
    const list = activeTab === "trackers" ? trackers : places;
    return list.find((item) => String(item.id) === selectedId) ?? null;
  }, [selectedId, activeTab, trackers, places]);

  const visibleItems = useMemo(() => {
    const list = activeTab === "trackers" ? trackers : places;
    return selectedId === "__all__"
      ? list
      : list.filter((item) => String(item.id) === selectedId);
  }, [selectedId, activeTab, trackers, places]);

  useEffect(() => {
    if (
      selectedItem &&
      mapRef.current &&
      selectedItem.latitude != null &&
      selectedItem.longitude != null
    ) {
      mapRef.current.animateToRegion(
        {
          latitude: selectedItem.latitude,
          longitude: selectedItem.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  }, [selectedItem]);

  const handleMarkerPress = (item: Tracker | Place) => {
    router.push({
      pathname: "/map/[id]",
      params: {
        id: String(item.id),
        type: activeTab,
      },
    });
  };

  return (
    <SafeAreaView style={[s.safeArea]}>
      <View style={s.headerWrap}>
        <AppHeader
          onAvatarPress={() => router.push("/profile")}
          showBack
        />
      </View>

      <Text style={s.title}>Map</Text>

      <View style={s.tabRow}>
        <TabButton active={activeTab === "trackers"} label="Trackers" onPress={() => {
          setActiveTab("trackers");
          setSelectedId("__all__");
        }} />
        <TabButton active={activeTab === "places"} label="Places" onPress={() => {
          setActiveTab("places");
          setSelectedId("__all__");
        }} />
      </View>

      <View style={s.dropdownWrap}>
        <DropDownPicker
          open={dropdownOpen}
          value={selectedId}
          items={dropdownItems}
          setOpen={setDropdownOpen}
          setValue={setSelectedId}
          setItems={setDropdownItems}
          placeholder={`Select a ${activeTab === "trackers" ? "tracker" : "place"}...`}
          style={{ borderColor: colors.MUTED }}
          textStyle={{ color: colors.TEXT }}
          dropDownContainerStyle={{ borderColor: colors.MUTED, backgroundColor: colors.CARD }}
        />
      </View>

      <View style={s.mapWrap}>
        {userLocation ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={userLocation}
            showsUserLocation
            showsMyLocationButton
          >
            {visibleItems.map((item) => {
              if (item.latitude == null || item.longitude == null) return null;
              return (
                <Marker
                  key={item.id}
                  coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                  title={activeTab === "trackers" ? `Tracker: ${item.id}` : item.name}
                  description={activeTab === "trackers"
                    ? `Product ID: ${(item as Tracker).productId}`
                    : `Type: ${(item as Place).placeType}`}
                  onPress={() => handleMarkerPress(item)}
                />
              );
            })}
          </MapView>
        ) : (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={colors.PURPLE} />
            <Text style={s.loadingText}>Loading map...</Text>
          </View>
        )}
      </View>

      <View style={s.bottomBarWrap}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 8,
        borderWidth: 1,
        borderRadius: 6,
        alignItems: "center",
        marginHorizontal: 4,
        backgroundColor: active ? colors.PURPLE : "transparent",
        borderColor: colors.MUTED,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "600", color: active ? colors.LAVENDER : colors.TEXT }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = ({ colors }: { colors: any }) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.BACK },
    headerWrap: { paddingTop: 12, paddingBottom: 4 },
    title: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 12,
      marginHorizontal: 16,
      color: colors.TEXT,
    },
    tabRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: colors.MUTED,
    },
    dropdownWrap: {
      marginHorizontal: 16,
      marginVertical: 8,
    },
    mapWrap: { flex: 1 },
    loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 12, color: colors.TEXT },
    bottomBarWrap: { position: "absolute", bottom: 0, left: 0, right: 0 },
  });