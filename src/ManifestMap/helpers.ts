import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

export const buildHeaders = async () => {
  const token = await AsyncStorage.getItem("access_token");
  const orgId = await AsyncStorage.getItem("organisationId");

  if (!token || !orgId) throw new Error("Missing token or organisationId");

  return {
    Authorization: `Bearer ${token}`,
    OrganisationId: orgId.trim(),
    "Content-Type": "application/json",
    "X-Caller-Component": "ManifestMapMobile",
  };
};

export type Tracker = {
  id: string;
  name?: string;
  productId?: number;
  latitude?: number;
  longitude?: number;
  temperature?: number;
  inTransit?: boolean;
  readyForCollection?: boolean;
  daysInPlace?: number;
  locationAccuracy?: number;
  daysSinceSeen?: number;
  trackerTags?: string[];
};

export type Place = {
  id: number;
  name: string;
  placeType: string;
  latitude: number;
  longitude: number;
  trackerCount: number;
  placeTags: { name: string; colour: string }[];
};

export const fetchMapTrackers = async (): Promise<Tracker[]> => {
  const headers = await buildHeaders();
  const orgId = headers.OrganisationId;

  try {
    const { data } = await axios.get(`${API_BASE_URL}/v1/mapTrackers`, {
      params: { organisationId: orgId },
      headers,
    });

    const list = Array.isArray(data?.data) ? data.data : [];

    const valid = list.filter((t: any) =>
      typeof t?.id === "string" &&
      t?.coordinates?.latitude != null &&
      t?.coordinates?.longitude != null
    );

    const invalid = list.filter((t: any) =>
      !t?.id || t?.coordinates?.latitude == null || t?.coordinates?.longitude == null
    );

    if (invalid.length > 0) {
      console.warn(`⚠️ Filtered out ${invalid.length} invalid trackers`);
    }

    return valid.map((t: any) => ({
      id: t.id,
      name: `Tracker ${t.id}`,
      productId: t.productId,
      latitude: t.coordinates.latitude,
      longitude: t.coordinates.longitude,
      temperature: t.temperature,
      inTransit: t.inTransit,
      readyForCollection: t.readyForCollection,
      daysInPlace: t.daysInPlace,
      locationAccuracy: t.locationAccuracy,
      daysSinceSeen: t.daysSinceSeen,
      trackerTags: t.trackerTags ?? [],
    }));
  } catch (err) {
    console.error("Error fetching map trackers:", err);
    return [];
  }
};

export const fetchPlaces = async (): Promise<Place[]> => {
  const headers = await buildHeaders();
  const orgId = headers.OrganisationId;

  try {
    const { data } = await axios.get(`${API_BASE_URL}/v1/places`, {
      params: { organisationId: orgId },
      headers,
    });

    return Array.isArray(data)
      ? data.map((p: any) => ({
          id: p.id,
          name: p.name,
          placeType: p.placeType,
          latitude: p.latitude,
          longitude: p.longitude,
          trackerCount: p.trackerCount ?? 0,
          placeTags: Array.isArray(p.placeTags) ? p.placeTags : [],
        }))
      : [];
  } catch (err) {
    console.error("Error fetching places:", err);
    return [];
  }
};