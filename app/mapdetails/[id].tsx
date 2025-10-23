import React, { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchMapTrackers,
  fetchPlaces,
  Tracker,
  Place,
} from "../../src/ManifestMap/helpers";

export default function MapDetailScreen() {
  const { id, type } = useLocalSearchParams(); // type = "tracker" or "place"
  const { colors } = useTheme();
  const s = useMemo(() => styles({ colors }), [colors]);

  const [item, setItem] = useState<Tracker | Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (type === "tracker") {
          const trackers = await fetchMapTrackers();
          const found = trackers.find((t) => t.id === id);
          setItem(found ?? null);
        } else {
          const places = await fetchPlaces();
          const found = places.find((p) => String(p.id) === id);
          setItem(found ?? null);
        }
      } catch (err) {
        console.error("Error loading detail:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, type]);

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <Text style={s.loadingText}>Loading details...</Text>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={s.safeArea}>
        <Text style={s.loadingText}>Item not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView contentContainerStyle={s.scrollWrap}>
        <Text style={s.title}>
          {type === "tracker" ? `Tracker: ${item.id}` : `Place: ${(item as Place).name}`}
        </Text>

        <View style={s.detailBox}>
          {type === "tracker" ? (
            <>
              <Detail label="Product ID" value={(item as Tracker).productId} />
              <Detail label="Temperature" value={`${(item as Tracker).temperature?.toFixed(1)}°C`} />
              <Detail label="In Transit" value={(item as Tracker).inTransit ? "Yes" : "No"} />
              <Detail label="Ready for Collection" value={(item as Tracker).readyForCollection ? "Yes" : "No"} />
              <Detail label="Days in Place" value={(item as Tracker).daysInPlace} />
              <Detail label="Location Accuracy" value={`${(item as Tracker).locationAccuracy}m`} />
              <Detail label="Latitude" value={(item as Tracker).latitude} />
              <Detail label="Longitude" value={(item as Tracker).longitude} />
              <Detail label="Tags" value={(item as Tracker).trackerTags?.join(", ") ?? "—"} />
            </>
          ) : (
            <>
              <Detail label="Place Type" value={(item as Place).placeType} />
              <Detail label="Tracker Count" value={(item as Place).trackerCount} />
              <Detail label="Latitude" value={(item as Place).latitude} />
              <Detail label="Longitude" value={(item as Place).longitude} />
              <Detail label="Tags" value={(item as Place).placeTags.map((tag) => tag.name).join(", ")} />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value: any }) {
  const { colors } = useTheme();
  const s = useMemo(() => styles({ colors }), [colors]);
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value ?? "—"}</Text>
    </View>
  );
}

const styles = ({ colors }: { colors: any }) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.BACK,
    },
    scrollWrap: {
      padding: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 16,
      color: colors.TEXT,
    },
    loadingText: {
      fontSize: 16,
      textAlign: "center",
      marginTop: 32,
      color: colors.TEXT,
    },
    detailBox: {
      marginTop: 8,
    },
    detailRow: {
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.MUTED,
    },
    detailValue: {
      fontSize: 16,
      color: colors.TEXT,
    },
  });