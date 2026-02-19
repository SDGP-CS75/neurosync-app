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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "../context/ThemeContext";
import Nav from "./Nav";

type TaskStatus = "done" | "in-progress" | "todo";

interface Task {
  id: string;
  category: string;
  title: string;
  time: string;
  status: TaskStatus;
  icon: string;
  iconBg: string;
}

interface DateItem {
  month: string;
  day: number;
  weekday: string;
  isToday: boolean;
}

const MOCK_DATES: DateItem[] = [
  { month: "May", day: 23, weekday: "Fri", isToday: false },
  { month: "May", day: 24, weekday: "Sat", isToday: false },
  { month: "May", day: 25, weekday: "Sun", isToday: true },
  { month: "May", day: 26, weekday: "Mon", isToday: false },
  { month: "May", day: 27, weekday: "Tue", isToday: false },
];

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    category: "Grocery shopping app design",
    title: "Market Research",
    time: "10:00 AM",
    status: "done",
    icon: "🛒",
    iconBg: "#FFE4E8",
  },
  {
    id: "2",
    category: "Grocery shopping app design",
    title: "Competitive Analysis",
    time: "12:00 PM",
    status: "in-progress",
    icon: "🛒",
    iconBg: "#FFE4E8",
  },
  {
    id: "3",
    category: "Uber Eats redesign challenge",
    title: "Create Low-fidelity Wireframe",
    time: "07:00 PM",
    status: "todo",
    icon: "👤",
    iconBg: "#E6E4FF",
  },
  {
    id: "4",
    category: "About design sprint",
    title: "How to pitch a Design Sprint",
    time: "09:00 PM",
    status: "todo",
    icon: "📖",
    iconBg: "#FFE9D5",
  },
];

export default function TodoListScreen() {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();

  const [selectedDate, setSelectedDate] = useState<number>(25);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");

  const isSmallScreen = width < 375;
  const cardPadding   = isSmallScreen ? 14 : 18;

  const filteredTasks =
    filter === "all"
      ? MOCK_TASKS
      : MOCK_TASKS.filter((t) => t.status === filter);

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Today's Tasks
        </Text>

        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={26} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.dateRow}>
          {MOCK_DATES.map((date) => {
            const isSelected = date.day === selectedDate;
            return (
              <TouchableOpacity
                key={date.day}
                onPress={() => setSelectedDate(date.day)}
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
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

        <View style={styles.taskList}>
          {filteredTasks.map((task) => {
            const statusConfig = getStatusConfig(task.status);

            return (
              <TouchableOpacity
                key={task.id}
                activeOpacity={0.9}
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
                  <View style={[styles.taskIconBox, { backgroundColor: task.iconBg }]}>
                    <Text style={styles.taskIcon}>{task.icon}</Text>
                  </View>
                </View>

                <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
                  {task.title}
                </Text>

                <View style={styles.taskFooter}>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                    <Text style={[styles.taskTime, { color: theme.colors.primary }]}>
                      {task.time}
                    </Text>
                  </View>

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
                </View>
              </TouchableOpacity>
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
  filterRow: {
    paddingHorizontal: 20,
    paddingVertical:   12,
    gap: 10,
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
  },
  filterText: {
    fontSize:   15,
    fontWeight: "600",
  },
  taskList: {
    paddingHorizontal: 20,
    gap: 14,
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