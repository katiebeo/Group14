import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../constants/theme"; 
export type Option = {
  label: string;
  value: string;
  id?: number;
  group?: string;
  icon?: React.ReactNode;
};

type Props = {
  value: string | string[] | null;
  options: Option[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multi?: boolean;
  loading?: boolean;
};

const SimpleSelect: React.FC<Props> = ({
  value,
  options = [],
  onChange,
  placeholder = "Select...",
  multi = false,
  loading = false,
}) => {
  const { colors, isDark } = useTheme();
  const s = useMemo(() => styles(colors, isDark), [colors, isDark]);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabels = Array.isArray(value)
    ? options.filter((o) => value?.includes(o.value)).map((o) => o.label).join(", ")
    : options.find((o) => o.value === value)?.label ?? "";

  const toggleMultiValue = (v: string) => {
    if (!Array.isArray(value)) return;
    const updated = value.includes(v)
      ? value.filter((x) => x !== v)
      : [...value, v];
    onChange(updated);
  };

  const filteredOptions = options.filter((o) =>
    typeof o.label === "string" && o.label.toLowerCase().includes(search.toLowerCase())
  );

  const groupedOptions = useMemo(() => {
    const groups: Record<string, Option[]> = {};
    filteredOptions.forEach((opt) => {
      const group = opt.group ?? "Ungrouped";
      if (!groups[group]) groups[group] = [];
      groups[group].push(opt);
    });
    return groups;
  }, [filteredOptions]);

  const closeModal = () => {
    setOpen(false);
    setSearch("");
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={s.input}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
      >
        <Text style={{ flex: 1, color: selectedLabels ? colors.TEXT : colors.PLACEHOLDER }}>
          {selectedLabels || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.TEXT} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.modalWrap}
        >
          <View style={s.modalHeader}>
            <Pressable onPress={closeModal} hitSlop={8}>
              <Ionicons name="chevron-back" size={26} color={colors.TEXT} />
            </Pressable>
            <Text style={s.modalTitle}>Select Option</Text>
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor={colors.PLACEHOLDER}
            style={s.searchInput}
          />

          {loading ? (
            <Text style={s.emptyText}>Loading options...</Text>
          ) : Object.keys(groupedOptions).length === 0 ? (
            <Text style={s.emptyText}>No options found.</Text>
          ) : (
            <FlatList
              data={Object.entries(groupedOptions)}
              keyExtractor={([groupName]) => groupName}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: [groupName, groupItems] }) => (
                <View>
                  <Text style={s.groupHeader}>{groupName}</Text>
                  {groupItems.map((item) => (
                    <Pressable
                      key={item.value}
                      onPress={() => {
                        if (multi) {
                          toggleMultiValue(item.value);
                        } else {
                          onChange(item.value);
                          closeModal();
                        }
                      }}
                      style={({ pressed }) => [
                        s.optionRow,
                        {
                          backgroundColor: pressed
                            ? isDark
                              ? colors.MUTED
                              : "rgba(0,0,0,0.05)"
                            : isDark
                              ? colors.CARD
                              : "#fff",
                        },
                      ]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        {item.icon && <View style={{ marginRight: 8 }}>{item.icon}</View>}
                        <Text style={[s.optionText, { color: colors.TEXT }]}>{item.label}</Text>
                      </View>
                      {multi && Array.isArray(value) && value.includes(item.value) && (
                        <Ionicons name="checkmark" size={18} color={colors.TEXT} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            />
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    input: {
      backgroundColor: isDark ? colors.INPUT : "#fff",
      borderWidth: 1,
      borderColor: colors.BORDER,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    searchInput: {
      backgroundColor: colors.INPUT,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
      fontSize: 16,
      color: colors.TEXT,
    },
    modalWrap: {
      flex: 1,
      backgroundColor: colors.BACK,
      paddingTop: 48,
      paddingHorizontal: 16,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginLeft: 8,
      color: colors.TEXT,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 20,
      color: colors.MUTED,
    },
    groupHeader: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.MUTED,
      marginTop: 16,
      marginBottom: 4,
      paddingHorizontal: 8,
    },
    optionRow: {
      paddingVertical: 14,
      paddingHorizontal: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 8,
    },
    optionText: {
      fontSize: 16,
    },
  });

export default SimpleSelect;