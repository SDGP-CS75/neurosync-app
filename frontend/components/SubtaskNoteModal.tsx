import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

const MAX_NOTE_LENGTH = 200;

interface SubtaskNoteModalProps {
  visible: boolean;
  onClose: () => void;
  initialNote: string;
  onSave: (note: string) => void;
  subtaskText: string;
}

export default function SubtaskNoteModal({
  visible,
  onClose,
  initialNote,
  onSave,
  subtaskText,
}: SubtaskNoteModalProps) {
  const { theme } = useAppTheme();
  const [note, setNote] = useState(initialNote);

  // Sync with initialNote when modal opens
  useEffect(() => {
    if (visible) setNote(initialNote);
  }, [visible, initialNote]);

  const handleSave = () => {
    onSave(note.trim());
    onClose();
  };

  const handleClear = () => {
    setNote("");
  };

  const remaining = MAX_NOTE_LENGTH - note.length;
  const isOverLimit = remaining < 0;
  const isNearLimit = remaining <= 20 && !isOverLimit;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={s.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <View
            style={[s.sheet, { backgroundColor: theme.colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            {/* Handle */}
            <View style={[s.handle, { backgroundColor: theme.colors.outline }]} />

            {/* Header */}
            <View style={s.header}>
              <View style={s.headerLeft}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[s.headerTitle, { color: theme.colors.text }]}>
                  Subtask Note
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={12}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Subtask label */}
            <View
              style={[
                s.subtaskLabel,
                { backgroundColor: theme.colors.primary + "12" },
              ]}
            >
              <Text
                style={[s.subtaskText, { color: theme.colors.primary }]}
                numberOfLines={2}
              >
                {subtaskText}
              </Text>
            </View>

            {/* Note input */}
            <View
              style={[
                s.inputWrap,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: isOverLimit
                    ? (theme.colors.error ?? "#ef4444")
                    : theme.colors.outline,
                },
              ]}
            >
              <TextInput
                style={[s.input, { color: theme.colors.text }]}
                placeholder="Add a note, link, or reminder for this subtask…"
                placeholderTextColor={theme.colors.textMuted}
                value={note}
                onChangeText={(t) => {
                  if (t.length <= MAX_NOTE_LENGTH + 10) setNote(t);
                }}
                multiline
                maxLength={MAX_NOTE_LENGTH + 10}
                textAlignVertical="top"
                autoFocus
              />

              {/* Clear button */}
              {note.length > 0 && (
                <TouchableOpacity
                  style={s.clearBtn}
                  onPress={handleClear}
                  hitSlop={8}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Character counter */}
            <View style={s.counterRow}>
              <Text
                style={[
                  s.counter,
                  {
                    color: isOverLimit
                      ? (theme.colors.error ?? "#ef4444")
                      : isNearLimit
                      ? "#f59e0b"
                      : theme.colors.textMuted,
                  },
                ]}
              >
                {note.length} / {MAX_NOTE_LENGTH}
              </Text>
              {isOverLimit && (
                <Text style={[s.overLimitText, { color: theme.colors.error ?? "#ef4444" }]}>
                  Too long — trim by {Math.abs(remaining)} characters
                </Text>
              )}
            </View>

            {/* Actions */}
            <View style={s.actions}>
              <TouchableOpacity
                style={[
                  s.cancelButton,
                  { borderColor: theme.colors.outline },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[s.cancelText, { color: theme.colors.textMuted }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.saveButton,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: isOverLimit ? 0.5 : 1,
                  },
                ]}
                onPress={handleSave}
                disabled={isOverLimit}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark" size={18} color="#FFF" />
                <Text style={s.saveText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtaskLabel: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  subtaskText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  inputWrap: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    minHeight: 110,
    position: "relative",
  },
  input: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    paddingRight: 28,
  },
  clearBtn: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  counter: {
    fontSize: 12,
    fontWeight: "500",
  },
  overLimitText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});