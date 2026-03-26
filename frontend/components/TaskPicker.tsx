import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "../context/ThemeContext";
import { useTasks, Task } from "../context/TasksContext";

interface TaskPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (task: Task | null) => void;
}

export default function TaskPicker({ visible, onClose, onSelect }: TaskPickerProps) {
  const { theme } = useAppTheme();
  const { tasks } = useTasks();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return tasks.filter(
      (t) =>
        t.status !== "done" &&
        (q === "" || t.title.toLowerCase().includes(q))
    );
  }, [tasks, query]);

  const handleSelect = (task: Task | null) => {
    setQuery("");
    onSelect(task);
    onClose();
  };

  const formatDue = (task: Task): string => {
    if (!task.dueDate) return "No date";
    try {
      const d = new Date(task.dueDate);
      if (isNaN(d.getTime())) return task.time ?? "No date";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(d);
      due.setHours(0, 0, 0, 0);
      const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
      if (diff === 0) return "Today";
      if (diff === 1) return "Tomorrow";
      if (diff === -1) return "Yesterday";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return task.time ?? "No date";
    }
  };

  const s = styles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={s.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={s.sheet}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Working on…</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={s.searchRow}>
            <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search tasks…"
              placeholderTextColor={theme.colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Task list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            style={s.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={s.empty}>
                {query ? "No matching tasks" : "No pending tasks"}
              </Text>
            }
            ListFooterComponent={
              <TouchableOpacity
                style={s.freeRow}
                onPress={() => handleSelect(null)}
                activeOpacity={0.8}
              >
                <View style={s.freeIcon}>
                  <Ionicons name="infinite-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={s.freeTextWrap}>
                  <Text style={s.freeTitle}>No task — free focus</Text>
                  <Text style={s.freeSub}>Just run the timer without linking a task</Text>
                </View>
              </TouchableOpacity>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.row}
                onPress={() => handleSelect(item)}
                activeOpacity={0.8}
              >
                {/* Emoji icon */}
                <View style={[s.iconWrap, { backgroundColor: item.iconBg }]}>
                  <Text style={s.iconEmoji}>{item.icon}</Text>
                </View>

                {/* Text */}
                <View style={s.textWrap}>
                  <Text style={s.taskTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={s.metaRow}>
                    <Text style={s.category}>{item.category}</Text>
                    {item.dueDate || item.time ? (
                      <>
                        <Text style={s.dot}>·</Text>
                        <Text style={s.due}>{formatDue(item)}</Text>
                      </>
                    ) : null}
                  </View>
                </View>

                {/* Status badge */}
                {item.status === "in-progress" && (
                  <View style={s.progressBadge}>
                    <Text style={s.progressBadgeText}>In Progress</Text>
                  </View>
                )}

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingBottom: 40,
      maxHeight: "80%",
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.outline,
      alignSelf: "center",
      marginBottom: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.text,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      marginHorizontal: 20,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
      marginBottom: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
    },
    list: {
      paddingHorizontal: 20,
    },
    empty: {
      textAlign: "center",
      color: theme.colors.textMuted,
      fontSize: 14,
      paddingVertical: 24,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline + "55",
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    iconEmoji: {
      fontSize: 20,
    },
    textWrap: {
      flex: 1,
    },
    taskTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 2,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    category: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    dot: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    due: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    progressBadge: {
      backgroundColor: theme.colors.primary + "22",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    progressBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.colors.primary,
    },
    // Free focus row pinned at bottom
    freeRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      gap: 12,
      marginTop: 4,
    },
    freeIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + "18",
      alignItems: "center",
      justifyContent: "center",
    },
    freeTextWrap: {
      flex: 1,
    },
    freeTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.primary,
      marginBottom: 2,
    },
    freeSub: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
  });