import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { useTheme } from "../../../constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE_URL = "https://stagingapi.binarytech.io";
const TOKEN_KEYS = ["access_token", "authToken", "token"];

async function getAuthToken(): Promise<string | null> {
  for (const key of TOKEN_KEYS) {
    try {
      const v = await SecureStore.getItemAsync(key);
      if (v) return v;
    } catch {}
  }
  for (const key of TOKEN_KEYS) {
    try {
      const v = await AsyncStorage.getItem(key);
      if (v) return v;
    } catch {}
  }
  return null;
}

async function buildHeaders() {
  const token = await getAuthToken();
  const orgId = (await AsyncStorage.getItem("organisationId"))?.trim();
  if (!token || !orgId) {
    const err = new Error("Missing auth token or organisationId");
    // @ts-ignore
    err.status = 401;
    throw err;
  }
  return {
    Authorization: `Bearer ${token}`,
    OrganisationId: orgId,
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-caller-component": "alert-detail",
  } as const;
}

async function apiGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  const headers = await buildHeaders();
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
  }
  const url = `${API_BASE_URL}${path}${qs.size ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err: any = new Error(`HTTP ${res.status}: ${body || res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function resolveAlert(alertId: string, note: string) {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE_URL}/api/alertnotifications`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "resolve",
      resolutionNote: note,
      alertId: Number(alertId),
    }),
  });

  const text = await res.text();
  console.log("Resolution response:", text);

  if (!res.ok) throw new Error(`Resolution failed: ${res.status}`);
  return true;
}

type AlertDetailsOutput = {
  AlertName: string;
  AssetId: string;
  SensorId: string;
  ProductId: number;
  PlaceId: number;
  PlaceName: string;
  Message: string;
  Token: string;
  SentTo: string | string[];
};

export default function AlertDetailPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const s = useMemo(() => styles({ colors }), [colors]);

  const [data, setData] = useState<AlertDetailsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!id) throw new Error("No alert id provided in route.");
        setErr(null);
        const d = await apiGet<AlertDetailsOutput>(`/api/alertdetails/${id}`);
        setData(d);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load alert");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const sentTo = Array.isArray(data?.SentTo) ? data.SentTo.join(", ") : data?.SentTo;

  return (
    <SafeAreaView style={s.safe}>
      {loading && <ActivityIndicator color={colors.PURPLE} />}
      {!loading && err && <Text style={s.errorText}>{err}</Text>}
      {!loading && data && (
        <>
          <Text style={s.title}>{data.AlertName}</Text>
          {!!data.Message && <Text style={s.message}>{data.Message}</Text>}

          <Detail label="Sensor" value={data.SensorId} />
          <Detail label="Place" value={`${data.PlaceName} (#${data.PlaceId})`} />
          {!!sentTo && <Detail label="Sent To" value={sentTo} />}
          {!!data.AssetId && <Detail label="Asset" value={data.AssetId} />}
          {!!data.Token && <Detail label="Token" value={data.Token} />}

          <View style={s.resolutionWrap}>
            <Text style={s.resolutionLabel}>Resolution Notes</Text>
            <TextInput
              multiline
              value={resolutionNote}
              onChangeText={setResolutionNote}
              placeholder="Enter resolution details..."
              placeholderTextColor={colors.MUTED}
              style={s.input}
            />
            <Pressable
              onPress={async () => {
                setResolving(true);
                try {
                  await resolveAlert(id!, resolutionNote);
                  setResolved(true);
                  setResolutionNote("");
                } catch (e) {
                  setErr("Resolution failed");
                } finally {
                  setResolving(false);
                }
              }}
              style={s.resolveBtn}
            >
              <Text style={s.resolveBtnText}>
                {resolving ? "Resolving..." : resolved ? "Resolved ✅" : "Resolve"}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: colors.MUTED }}>{label}</Text>
      <Text style={{ color: colors.TEXT }}>{value}</Text>
    </View>
  );
}

const styles = ({ colors }: { colors: any }) =>
  StyleSheet.create({
    safe: { flex: 1, padding: 16, backgroundColor: colors.BACK },
    title: { fontSize: 22, fontWeight: "800", color: colors.TEXT },
    message: { marginTop: 8, color: colors.TEXT },
    errorText: { color: colors.TEXT, marginTop: 12 },
    resolutionWrap: { marginTop: 24 },
    resolutionLabel: { fontWeight: "700", color: colors.TEXT },
    input: {
      borderWidth: 1,
      borderColor: colors.MUTED,
      backgroundColor: colors.INPUT,
      borderRadius: 8,
      padding: 10,
      marginTop: 8,
      color: colors.TEXT,
    },
    resolveBtn: {
      backgroundColor: colors.PURPLE,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 12,
    },
    resolveBtnText: {
      color: colors.LAVENDER,
      fontWeight: "700",
      textAlign: "center",
    },
  });