// components/MapSort.tsx
import React from "react";
import { Modal, Pressable, SafeAreaView, Text, View } from "react-native";
import { useTheme } from "../constants/theme";

type Tab = "trackers" | "places";
type SortRow = {
  id: string;
  label: string;
  appliesTo: Tab;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  activeTab: Tab;
  sortId: string;
  onSelect: (id: string) => void;
  options: SortRow[];
};

export default function MapSort({
  visible,
  onClose,
  activeTab,
  sortId,
  onSelect,
  options,
}: Props) {
  const { colors } = useTheme();
  const opts = options.filter((o) => o.appliesTo === activeTab);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }} onPress={onClose}>
        <View />
      </Pressable>

      <SafeAreaView style={{ position: "absolute", right: 12, top: 110, left: 12 }}>
        <View
          style={{
            borderRadius: 14,
            overflow: "hidden",
            backgroundColor: colors.BACK,
            borderWidth: 1,
            borderColor: colors.MUTED,
          }}
        >
          {opts.map((opt) => {
            const isActive = opt.id === sortId;
            return (
              <Pressable
                key={opt.id}
                onPress={() => {
                  onSelect(opt.id);
                  onClose();
                }}
                style={({ pressed }) => [
                  {
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: isActive
                      ? colors.PURPLE
                      : pressed
                      ? colors.INPUT
                      : "transparent",
                  },
                ]}
              >
                <Text
                  style={{
                    color: isActive ? "#fff" : colors.TEXT,
                    fontWeight: isActive ? "800" : "600",
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
