/**
 * app/components/TodoListScreen.tsx
 * ─────────────────────────────────────────────────────────────────
 * Daily tasks screen with date picker, filters, and task cards.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../context/ThemeContext";
import { useTasks, type Task, type TaskStatus, } from "../../context/TasksContext";
import Nav from "../../components/Nav";

interface DateItem {
  dateKey: string;
  month: string;
  day: number;
  weekday: string;
  isToday: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_ORDER: Record<TaskStatus, number> = {
  "in-progress": 0,
  todo: 1,
  done: 2,
};

function getDatesAroundToday(): DateItem[] {
  const items: DateItem[] = [];
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  for (let offset = -2; offset <= 2; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    const dateKey = d.toISOString().slice(0, 10);
    items.push({
      dateKey,
      month: MONTHS[d.getMonth()],
      day: d.getDate(),
      weekday: WEEKDAYS[d.getDay()],
      isToday: dateKey === todayKey,
    });
  }
  return items;
}

// Match Nav.tsx so scroll padding clears the bottom bar
const BASE_WIDTH = 390;

const todayDateKey = () => new Date().toISOString().slice(0, 10);

export default function TodoListScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { tasks, isLoading, removeTask, toggleSubtaskDone, toggleTaskStatus } = useTasks();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const scale = Math.min(width / BASE_WIDTH, 1.35);
  const NAV_HEIGHT = Math.round(64 * scale);
  const safeBottom =
    Platform.OS === "ios"
      ? insets.bottom
      : Math.max(insets.bottom, 8);
  const bottomPadding = NAV_HEIGHT + safeBottom + 80;

  const [selectedDate, setSelectedDate] = useState<string>(todayDateKey());
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");

  const isSmallScreen = width < 375;
  const cardPadding   = isSmallScreen ? 14 : 18;

  const dateItems = getDatesAroundToday();
  const tasksForDate = tasks.filter((t) => t.dateKey === selectedDate);
  const filteredTasks =
    filter === "all"
      ? [...tasksForDate].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
      : tasksForDate.filter((t) => t.status === filter);

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case "done":
        return {
          label: "Done",
          bg: theme.colors.statusDone,
          color: "#2E7D32",
        };
      case "in-progress":
        return {
          label: "In Progress",
          bg: theme.colors.statusInProgress,
          color: "#E65100",
        };
      case "todo":
        return {
          label: "To-do",
          bg: theme.colors.statusTodo,
          color: "#1976D2",
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Today's Tasks
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => router.push('./calendar')}
          >
            <Ionicons name="calendar-outline" size={26} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={26} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: bottomPadding,
        }}
      >
        <View style={styles.dateRow}>
          {dateItems.map((date) => {
            const isSelected = date.dateKey === selectedDate;
            return (
              <TouchableOpacity
                key={date.dateKey}
                onPress={() => setSelectedDate(date.dateKey)}
                activeOpacity={0.8}
                style={[
                  styles.dateCard,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dateMonth,
                    { color: isSelected ? "#FFF" : theme.colors.textMuted },
                  ]}
                >
                  {date.month}
                </Text>
                <Text
                  style={[
                    styles.dateDay,
                    { color: isSelected ? "#FFF" : theme.colors.text },
                  ]}
                >
                  {date.day}
                </Text>
                <Text
                  style={[
                    styles.dateWeekday,
                    { color: isSelected ? "#FFF" : theme.colors.textMuted },
                  ]}
                >
                  {date.weekday}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.filterRowWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.filterScroll}
          >
          {[
            { key: "all", label: "All" },
            { key: "todo", label: "To do" },
            { key: "in-progress", label: "In Progress" },
            { key: "done", label: "Completed" },
          ].map((item) => {
            const isActive = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setFilter(item.key as any)}
                activeOpacity={0.8}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive
                      ? theme.colors.primary
                      : theme.colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isActive ? "#FFF" : theme.colors.primary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          </ScrollView>
        </View>

        <View style={styles.taskList}>
          {!isLoading && filteredTasks.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                No tasks for this day. Tap + to add one.
              </Text>
            </View>
          ) : null}
          {filteredTasks.map((task) => {
            const statusConfig = getStatusConfig(task.status);

            const handleDelete = () => {
              Alert.alert(
                "Delete task",
                `Remove "${task.title}" from your list?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => removeTask(task.id),
                  },
                ]
              );
            };

            return (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: theme.colors.surface,
                    padding: cardPadding,
                  },
                ]}
              >
                <View style={styles.taskHeader}>
                  <Text style={[styles.taskCategory, { color: theme.colors.textMuted }]}>
                    {task.category}
                  </Text>
                  <View style={styles.taskHeaderRight}>
                    <View style={[styles.taskIconBox, { backgroundColor: task.iconBg }]}>
                      <Text style={styles.taskIcon}>{task.icon}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleDelete}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={22} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text
                  style={[
                    styles.taskTitle,
                    {
                      color: theme.colors.text,
                      textDecorationLine: task.status === "done" ? "line-through" : "none",
                    },
                  ]}
                >
                  {task.title}
                </Text>

                {/* Subtasks */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <View style={styles.subtasksContainer}>
                    {task.subtasks.map((sub, index) => (
                      <TouchableOpacity
                        key={sub.id}
                        style={styles.subtaskRow}
                        activeOpacity={0.7}
                        onPress={() => toggleSubtaskDone(task.id, sub.id)}
                      >
                        <Ionicons
                          name={sub.isDone ? "checkbox" : "square-outline"}
                          size={18}
                          color={sub.isDone ? theme.colors.primary : theme.colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.subtaskText,
                            {
                              color: sub.isDone
                                ? theme.colors.textMuted
                                : theme.colors.text,
                              textDecorationLine: sub.isDone ? "line-through" : "none",
                            },
                          ]}
                        >
                          {sub.text}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={styles.taskFooter}>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                    <Text style={[styles.taskTime, { color: theme.colors.primary }]}>
                      {task.time}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => toggleTaskStatus(task.id)}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusConfig.bg },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <Nav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical:   16,
  },
  headerTitle: {
    fontSize:   24,
    fontWeight: "700",
  },
  dateRow: {
    flexDirection:  "row",
    paddingHorizontal: 20,
    paddingVertical:   16,
    gap: 10,
  },
  dateCard: {
    flex: 1,
    alignItems:     "center",
    paddingVertical: 14,
    borderRadius:    16,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    6,
    elevation:       3,
  },
  dateMonth: {
    fontSize:   12,
    fontWeight: "600",
    marginBottom: 2,
  },
  dateDay: {
    fontSize:   28,
    fontWeight: "700",
    marginBottom: 2,
  },
  dateWeekday: {
    fontSize:   13,
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  filterRowWrap: {
    paddingHorizontal: 20,
    marginBottom: 10,
    height: 48,
    justifyContent: "center",
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterRow: {
    paddingVertical: 0,
    gap: 10,
    alignItems: "center",
  },
  filterPill: {
    paddingHorizontal: 22,
    paddingVertical:   12,
    borderRadius:      20,
    shadowColor:       "#000",
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.06,
    shadowRadius:      4,
    elevation:         2,
    alignSelf:         "center",
    marginBottom: 3,
    marginTop: 3,

  },
  filterText: {
    fontSize:   15,
    fontWeight: "600",
  },
  taskList: {
    paddingHorizontal: 20,
    gap: 14,
  },
  emptyWrap: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  taskCard: {
    borderRadius:  16,
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius:  8,
    elevation:     4,
  },
  taskHeader: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   8,
  },
  taskHeaderRight: {
    flexDirection: "row",
    alignItems:     "center",
    gap:            8,
  },
  deleteBtn: {
    padding: 10,
    margin: -6,
  },
  taskCategory: {
    fontSize:   13,
    fontWeight: "500",
    flex: 1,
  },
  taskIconBox: {
    width:        36,
    height:       36,
    borderRadius: 10,
    alignItems:   "center",
    justifyContent: "center",
  },
  taskIcon: {
    fontSize: 18,
  },
  taskTitle: {
    fontSize:     18,
    fontWeight:   "700",
    marginBottom: 12,
  },
  subtasksContainer: {
    marginTop: 8,
    gap: 4,
  },

  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
    gap: 6,
  },


  subtaskText: {
    fontSize: 13,
  },
  taskFooter: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
  },
  timeRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap: 6,
  },
  taskTime: {
    fontSize:   14,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      12,
  },
  statusText: {
    fontSize:   13,
    fontWeight: "600",
  },
});
