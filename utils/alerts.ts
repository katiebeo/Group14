import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "https://stagingapi.binarytech.io";

const TOKEN_KEYS = ["access_token", "authToken", "token"];

export async function getAuthToken(): Promise<string | null> {
  for (const key of TOKEN_KEYS) {
    const v = await SecureStore.getItemAsync(key);
    if (v) return v;
  }
  for (const key of TOKEN_KEYS) {
    const v = await AsyncStorage.getItem(key);
    if (v) return v;
  }
  return null;
}

export async function buildHeaders(): Promise<Record<string, string>> {
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
  };
}

async function apiGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  const headers = await buildHeaders();
  const orgId = (await AsyncStorage.getItem("organisationId"))?.trim();

  const finalParams = { ...(params ?? {}), organisationId: orgId };
  const qs = new URLSearchParams();
  Object.entries(finalParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });

  const url = `${API_BASE_URL}${path}${qs.size ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status}: ${body || res.statusText}`);
    // @ts-ignore
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export type AlertItem = {
  id: string;
  dateISO: string;
  title: string;
  status: "Active" | "Inactive";
};

export async function fetchAlertsRemote({
  skip = 0,
  top = 100,
  orderby = "timestamp desc",
}: {
  skip?: number;
  top?: number;
  orderby?: string;
} = {}): Promise<AlertItem[]> {
  const candidates: Array<{
    path: string;
    params?: Record<string, any>;
    mapper: (json: any) => AlertItem[];
    mustReturnIfOk?: boolean;
  }> = [
    {
      path: "/v1/alertnotifications",
      params: { skip, top, orderby },
      mapper: (json) => {
        const list: any[] =
          Array.isArray(json?.value) ? json.value :
          Array.isArray(json?.items) ? json.items :
          Array.isArray(json) ? json : [];

        return list.map((n: any, idx: number): AlertItem => {
          const id = n.id ?? n.notificationId ?? String(idx);
          const ts = n.timestamp ?? n.createdAt ?? n.raisedAt ?? new Date().toISOString();
          const resolved =
            !!n.isResolved ||
            !!n.resolvedAt ||
            (typeof n.status === "string" && /resolve|closed|inactive/i.test(n.status));
          return {
            id,
            dateISO: new Date(ts).toISOString(),
            title: n.title ?? n.message ?? n.summary ?? "Alert",
            status: resolved ? "Inactive" : "Active",
          };
        });
      },
      mustReturnIfOk: true,
    },
    {
      path: "/api/alerts",
      params: { skip, top, orderby: orderby.replace("timestamp", "createdAt") },
      mapper: (json) => {
        const list: any[] = Array.isArray(json) ? json : Array.isArray(json?.value) ? json.value : [];
        return list.map((a: any, idx: number): AlertItem => {
          const id = a.id ?? a.alertId ?? a.uuid ?? String(idx);
          const createdISO =
            a.createdAt ?? a.raisedAt ?? a.date ?? a.timestamp ?? new Date().toISOString();

          let status: AlertItem["status"] = "Active";
          if (typeof a.isActive === "boolean") status = a.isActive ? "Active" : "Inactive";
          else if (typeof a.isResolved === "boolean") status = a.isResolved ? "Inactive" : "Active";
          else if (typeof a.status === "string")
            status = /resolve|closed|inactive/i.test(a.status) ? "Inactive" : "Active";

          return {
            id,
            dateISO: new Date(createdISO).toISOString(),
            title: a.title ?? a.message ?? a.summary ?? "Alert",
            status,
          };
        });
      },
    },
  ];

  let lastErr: any;
  for (const ep of candidates) {
    try {
      const data = await apiGet<any>(ep.path, ep.params);
      const mapped = ep.mapper(data)
        .filter(Boolean)
        .sort((a, b) => +new Date(b.dateISO) - +new Date(a.dateISO));
      if (mapped.length || ep.mustReturnIfOk) return mapped;
    } catch (e) {
      console.warn(`Failed to fetch from ${ep.path}:`, e.message);
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("No alerts endpoint available");
}