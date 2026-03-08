/**
 * app/components/AddTaskModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Bottom sheet modal for adding new tasks.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "../context/ThemeContext";

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (task: {
    title: string;
    category: string;
    time: string;
    status: string;
  }) => void;
}

export default function AddTaskModal({ visible, onClose, onSave }: AddTaskModalProps) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<"todo" | "in-progress" | "done">("todo");

  const isSmallScreen = width < 375;

  const handleSave = () => {
    if (!title.trim()) return;

    onSave?.({
      title: title.trim(),
      category: category.trim() || "Personal",
      time: time.trim() || "12:00 PM",
      status,
    });

    setTitle("");
    setCategory("");
    setTime("");
    setStatus("todo");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              paddingHorizontal: isSmallScreen ? 20 : 24,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View
            style={[styles.handleBar, { backgroundColor: theme.colors.outline }]}
          />

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Add New Task
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={26} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>
                Task Title
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.outline,
                  },
                ]}
                placeholder="Enter task title"
                placeholderTextColor={theme.colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>
                Category
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.outline,
                  },
                ]}
                placeholder="e.g. Work, Personal, Shopping"
                placeholderTextColor={theme.colors.textMuted}
                value={category}
                onChangeText={setCategory}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>
                Time
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.outline,
                  },
                ]}
                placeholder="e.g. 10:00 AM"
                placeholderTextColor={theme.colors.textMuted}
                value={time}
                onChangeText={setTime}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>
                Status
              </Text>
              <View style={styles.statusRow}>
                {(["todo", "in-progress", "done"] as const).map((s) => {
                  const isSelected = status === s;
                  const label = s === "todo" ? "To-do" : s === "in-progress" ? "In Progress" : "Done";
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setStatus(s)}
                      activeOpacity={0.8}
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.background,
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.outline,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusLabel,
                          { color: isSelected ? "#FFF" : theme.colors.textMuted },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleSave}
              disabled={!title.trim()}
              style={styles.saveButton}
            >
              Add Task
            </Button>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingTop:    12,
    paddingBottom: 40,
    maxHeight:     "85%",
  },
  handleBar: {
    width:        40,
    height:       4,
    borderRadius: 2,
    alignSelf:    "center",
    marginBottom: 16,
  },
  header: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   24,
  },
  title: {
    fontSize:   22,
    fontWeight: "700",
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize:     14,
    fontWeight:   "600",
    marginBottom: 8,
  },
  input: {
    borderRadius:      12,
    borderWidth:       1,
    paddingHorizontal: 16,
    paddingVertical:   14,
    fontSize:          16,
  },
  statusRow: {
    flexDirection: "row",
    gap: 10,
  },
  statusChip: {
    flex: 1,
    paddingVertical:   12,
    borderRadius:      12,
    borderWidth:       1,
    alignItems:        "center",
  },
  statusLabel: {
    fontSize:   14,
    fontWeight: "600",
  },
  saveButton: {
    marginTop:      24,
    paddingVertical: 8,
  },
});