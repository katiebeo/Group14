import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export type AlertItem = {
  id: string;
  title: string;
  status: "Active" | "Resolved";
  dateISO: string;
  message?: string;
  sensorId?: string;
  assetId?: string;
  placeName?: string;
  placeId?: number;
  sentTo?: string[];
  token?: string;
};

const AlertContext = createContext<{
  alerts: AlertItem[];
  refreshAlerts: () => Promise<void>;
}>({
  alerts: [],
  refreshAlerts: async () => {},
});

export const useAlerts = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

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
    if (!token || !orgId) throw new Error("Missing auth token or organisationId");
    return {
      Authorization: `Bearer ${token}`,
      OrganisationId: orgId,
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-caller-component": "alert-context",
    };
  }

  const fetchAlertsRemote = async (): Promise<AlertItem[]> => {
    const headers = await buildHeaders();
    const res = await fetch("https://stagingapi.binarytech.io/v1/alertnotifications", {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Alert fetch failed: ${res.status} - ${errorText}`);
      return [];
    }

    const json = await res.json();
    const list = Array.isArray(json?.value) ? json.value : Array.isArray(json) ? json : [];

    console.log("Raw alert response:", list);

    return list.map((n: any): AlertItem => ({
      id: String(n.alertId ?? n.id),
      title: n.alertText ?? n.message ?? "Alert",
      status: n.resolvedStatus ? "Resolved" : "Active",
      dateISO: typeof n.timestamp === "number"
        ? new Date(n.timestamp * 1000).toISOString()
        : new Date(n.timestamp).toISOString(),
      message: n.message,
      sensorId: n.sensorId,
      assetId: n.assetId,
      placeName: n.placeName,
      placeId: n.placeId,
      sentTo: Array.isArray(n.sentTo) ? n.sentTo : n.sentTo ? [n.sentTo] : [],
      token: n.token,
    }));
  };

  const refreshAlerts = async () => {
    try {
      const data = await fetchAlertsRemote();
      setAlerts(data);
    } catch (e) {
      console.error("Alert refresh failed:", e);
    }
  };

  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, refreshAlerts }}>
      {children}
    </AlertContext.Provider>
  );
};