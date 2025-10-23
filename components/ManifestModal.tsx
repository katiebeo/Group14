import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";

export default function ManifestModal({
  visible,
  onClose,
  onSubmit,
  userOptions,
  placeOptions,
  mode,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  userOptions: { label: string; value: string }[];
  placeOptions: { label: string; value: string }[];
  mode: "start" | "end";
}) {
  const [timestamp, setTimestamp] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPlace, setSelectedPlace] = useState("");
  const [autoStart, setAutoStart] = useState(false);
  const [autoEnd, setAutoEnd] = useState(false);

  useEffect(() => {
    if (visible) {
      setTimestamp(new Date());
      setSelectedUser("");
      setSelectedPlace("");
      setAutoStart(false);
      setAutoEnd(false);
    }
  }, [visible]);

  const isStart = mode === "start";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalWrap}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>{isStart ? "Start Manifest" : "End Manifest"}</Text>

            <Text style={styles.label}>{isStart ? "Start Time" : "End Time"}</Text>
            <Pressable onPress={() => setShowPicker(true)} style={styles.input}>
              <Text>{timestamp.toLocaleString()}</Text>
            </Pressable>
            {showPicker && (
              <DateTimePicker
                value={timestamp}
                mode="datetime"
                display="default"
                onChange={(event, date) => {
                  setShowPicker(false);
                  if (date) setTimestamp(date);
                }}
              />
            )}

            <Text style={styles.label}>{isStart ? "Start Place" : "Target Place"}</Text>
            <RNPickerSelect
              onValueChange={setSelectedPlace}
              items={placeOptions}
              placeholder={{ label: "Select a place", value: null }}
              style={pickerStyles}
              value={selectedPlace}
            />

            <Text style={styles.label}>{isStart ? "Starting User" : "Ending User"}</Text>
            <RNPickerSelect
              onValueChange={setSelectedUser}
              items={userOptions}
              placeholder={{ label: "Select a user", value: null }}
              style={pickerStyles}
              value={selectedUser}
            />

            {isStart && (
              <>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Auto Start</Text>
                  <Switch value={autoStart} onValueChange={setAutoStart} />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Auto End</Text>
                  <Switch value={autoEnd} onValueChange={setAutoEnd} />
                </View>
              </>
            )}

            <View style={styles.buttonRow}>
              <Pressable onPress={onClose} style={styles.cancel}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!selectedUser || !selectedPlace) return Alert.alert("Missing fields");
                  const payload = isStart
                    ? {
                        startTime: timestamp.toISOString(),
                        startPlaceId: parseInt(selectedPlace),
                        startingUserId: selectedUser,
                        autoStart,
                        autoEnd,
                      }
                    : {
                        endTime: timestamp.toISOString(),
                        targetPlaceId: parseInt(selectedPlace),
                        endUserId: selectedUser,
                      };
                  onSubmit(payload);
                }}
                style={styles.confirm}
              >
                <Text style={styles.buttonText}>{isStart ? "Start" : "End"}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  modalWrap: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  scroll: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancel: {
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  confirm: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    flex: 1,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});

const pickerStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
};