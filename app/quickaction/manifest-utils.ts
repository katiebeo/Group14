import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ManifestItem {
  id: string;
  name: string;
  trackerId: string;
  dateCreated: string;
  status: string;
  startingUserName: string;
  description: string;
}

export async function fetchUserManifests(): Promise<ManifestItem[]> {
  const token = await AsyncStorage.getItem("access_token");
  const orgId = await AsyncStorage.getItem("organisationId");

  if (!token || !orgId) throw new Error("Missing credentials");

  const res = await fetch(
    `https://stagingapi.binarytech.io/v1/manifests?orderby=CreatedTime desc&top=50`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        OrganisationId: orgId,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch manifests");

  const manifestList = await res.json();


return manifestList.map((m: any) => ({
  id: String(m.id),
  name: m.name ?? "Unnamed",
  trackerId: m.sensorId ?? "N/A",
  dateCreated: m.createdTime ?? new Date().toISOString(),
  status: m.status ?? "Not Started",
  startingUserName: m.startingUserName ?? "Unknown",
  description: m.description ?? "No description", 
}));
}

