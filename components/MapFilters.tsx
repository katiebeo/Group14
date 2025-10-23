// components/MapFilters.tsx
import React from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../constants/theme";

/* ---------------- Types & defaults (exported) ---------------- */
export type Filters = {
  hidePlaces: boolean;
  hideTrackersAtPlaces: boolean;
  hideTrackersInTransit: boolean;

  placeMinTrackers: number | null;
  placeMaxTrackers: number | null;
  placeTypes: string[];
  placeTags: string[];

  assetTypes: string[];
  trackerTags: string[];
  trackerTypes: string[];

  tempMin: number | null;
  tempMax: number | null;

  daysAtPlaceMin: number | null;
  daysAtPlaceMax: number | null;

  daysSinceSeenMin: number | null; // in days
  daysSinceSeenMax: number | null; // in days
};

export const DEFAULT_FILTERS: Filters = {
  hidePlaces: false,
  hideTrackersAtPlaces: false,
  hideTrackersInTransit: false,

  placeMinTrackers: null,
  placeMaxTrackers: null,
  placeTypes: [],
  placeTags: [],

  assetTypes: [],
  trackerTags: [],
  trackerTypes: [],

  tempMin: null,
  tempMax: null,

  daysAtPlaceMin: null,
  daysAtPlaceMax: null,

  daysSinceSeenMin: null,
  daysSinceSeenMax: null,
};

/* ---------------- Component ---------------- */
type Props = {
  visible: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (next: Filters) => void;
  optionLists: {
    assetTypeOptions: string[];
    trackerTagOptions: string[];
    trackerTypeOptions: string[];
    placeTypeOptions: string[];
    placeTagOptions: string[];
  };
  defaultFilters?: Filters; 
};

export default function MapFilters({
  visible,
  onClose,
  filters,
  onChange,
  optionLists,
  defaultFilters = DEFAULT_FILTERS,
}: Props) {
  const { colors } = useTheme();

  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[s.modalRoot, { backgroundColor: colors.BACK }]}>
        <View style={[s.modalHeader, { borderColor: colors.MUTED }]}>
          <Text style={[s.modalTitle, { color: colors.TEXT }]}>Filters</Text>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={() => onChange({ ...defaultFilters })} style={[s.headerBtn, { backgroundColor: colors.CARD }]}>
              <Text style={{ color: colors.TEXT }}>Reset All</Text>
            </Pressable>
            <Pressable onPress={onClose} style={[s.headerBtn, { backgroundColor: colors.CARD }]}>
              <Text style={{ color: colors.TEXT }}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
          <Section title="Number of Trackers at a Place">
            <MinMaxInputs
              colors={colors}
              minValue={filters.placeMinTrackers}
              maxValue={filters.placeMaxTrackers}
              onChange={(min, max) => set({ placeMinTrackers: min, placeMaxTrackers: max })}
              leftLabel="min"
              rightLabel="max"
            />
          </Section>

          <Section title="Hide Markers">
            <Checkbox label="Places" checked={filters.hidePlaces} onChange={(v) => set({ hidePlaces: v })} />
            <Checkbox label="Trackers at places" checked={filters.hideTrackersAtPlaces} onChange={(v) => set({ hideTrackersAtPlaces: v })} />
            <Checkbox label="Trackers in transit" checked={filters.hideTrackersInTransit} onChange={(v) => set({ hideTrackersInTransit: v })} />
          </Section>

          <Section title="Asset Types">
            <MultiSelectChips
              colors={colors}
              options={optionLists.assetTypeOptions}
              selected={filters.assetTypes}
              onToggle={(val) =>
                set({
                  assetTypes: filters.assetTypes.includes(val)
                    ? filters.assetTypes.filter((x) => x !== val)
                    : [...filters.assetTypes, val],
                })
              }
            />
          </Section>

          <Section title="Tracker Tags">
            <MultiSelectChips
              colors={colors}
              options={optionLists.trackerTagOptions}
              selected={filters.trackerTags}
              onToggle={(val) =>
                set({
                  trackerTags: filters.trackerTags.includes(val)
                    ? filters.trackerTags.filter((x) => x !== val)
                    : [...filters.trackerTags, val],
                })
              }
            />
          </Section>

          <Section title="Place Types">
            <MultiSelectChips
              colors={colors}
              options={optionLists.placeTypeOptions}
              selected={filters.placeTypes}
              onToggle={(val) =>
                set({
                  placeTypes: filters.placeTypes.includes(val)
                    ? filters.placeTypes.filter((x) => x !== val)
                    : [...filters.placeTypes, val],
                })
              }
            />
          </Section>

          <Section title="Place Tags">
            <MultiSelectChips
              colors={colors}
              options={optionLists.placeTagOptions}
              selected={filters.placeTags}
              onToggle={(val) =>
                set({
                  placeTags: filters.placeTags.includes(val)
                    ? filters.placeTags.filter((x) => x !== val)
                    : [...filters.placeTags, val],
                })
              }
            />
          </Section>

          <Section title="Temperature (°C)">
            <MinMaxInputs
              colors={colors}
              minValue={filters.tempMin}
              maxValue={filters.tempMax}
              onChange={(min, max) => set({ tempMin: min, tempMax: max })}
              leftLabel="min °C"
              rightLabel="max °C"
            />
          </Section>

          <Section title="Days a tracker has been at a place">
            <MinMaxInputs
              colors={colors}
              minValue={filters.daysAtPlaceMin}
              maxValue={filters.daysAtPlaceMax}
              onChange={(min, max) => set({ daysAtPlaceMin: min, daysAtPlaceMax: max })}
              leftLabel="min days"
              rightLabel="max days"
            />
          </Section>

          <Section title="Days since a tracker was last seen">
            <MinMaxInputs
              colors={colors}
              minValue={filters.daysSinceSeenMin}
              maxValue={filters.daysSinceSeenMax}
              onChange={(min, max) => set({ daysSinceSeenMin: min, daysSinceSeenMax: max })}
              leftLabel="min days"
              rightLabel="max days"
            />
          </Section>

          <Section title="Tracker Types">
            <MultiSelectChips
              colors={colors}
              options={optionLists.trackerTypeOptions}
              selected={filters.trackerTypes}
              onToggle={(val) =>
                set({
                  trackerTypes: filters.trackerTypes.includes(val)
                    ? filters.trackerTypes.filter((x) => x !== val)
                    : [...filters.trackerTypes, val],
                })
              }
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* Local UI helpers*/
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.DARK, fontWeight: "700" }}>{title}</Text>
      <View style={{ gap: 10 }}>{children}</View>
      <View style={{ height: 1, backgroundColor: colors.MUTED, opacity: 0.25, marginTop: 8 }} />
    </View>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => onChange(!checked)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? colors.PURPLE : colors.MUTED,
          backgroundColor: checked ? colors.PURPLE : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked ? <Text style={{ color: "#fff", fontWeight: "800" }}>✓</Text> : null}
      </View>
      <Text style={{ color: colors.TEXT }}>{label}</Text>
    </Pressable>
  );
}

function MinMaxInputs({
  colors,
  minValue,
  maxValue,
  onChange,
  leftLabel,
  rightLabel,
}: {
  colors: any;
  minValue: number | null;
  maxValue: number | null;
  onChange: (min: number | null, max: number | null) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.DARK, marginBottom: 4 }}>{leftLabel}</Text>
        <TextInput
          keyboardType="numeric"
          placeholder="—"
          placeholderTextColor="#9CA3AF"
          value={minValue !== null ? String(minValue) : ""}
          onChangeText={(t) => onChange(t === "" ? null : Number(t), maxValue)}
          style={{ borderWidth: 1, borderColor: colors.MUTED, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: colors.TEXT }}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.DARK, marginBottom: 4 }}>{rightLabel}</Text>
        <TextInput
          keyboardType="numeric"
          placeholder="—"
          placeholderTextColor="#9CA3AF"
          value={maxValue !== null ? String(maxValue) : ""}
          onChangeText={(t) => onChange(minValue, t === "" ? null : Number(t))}
          style={{ borderWidth: 1, borderColor: colors.MUTED, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: colors.TEXT }}
        />
      </View>
    </View>
  );
}

function MultiSelectChips({
  colors,
  options,
  selected,
  onToggle,
}: {
  colors: any;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const isSel = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => onToggle(opt)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: isSel ? colors.PURPLE : colors.MUTED,
              backgroundColor: isSel ? colors.LAVENDER : "transparent",
            }}
          >
            <Text style={{ color: isSel ? colors.PURPLE : colors.TEXT, fontWeight: "600" }}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------- Styles ---------------- */
const s = StyleSheet.create({
  modalRoot: { flex: 1 },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontWeight: "800", fontSize: 18 },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
});
