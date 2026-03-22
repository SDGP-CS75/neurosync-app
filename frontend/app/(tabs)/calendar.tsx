import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../context/ThemeContext";
import { useTasks, Task } from "../../context/TasksContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 32) / 7);

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type ViewMode = "month" | "week";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDueDate(task: Task): Date | null {
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function taskDateKey(task: Task): string | null {
  const d = parseDueDate(task);
  if (!d) return null;
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatTimeDisplay(task: Task): string {
  const d = parseDueDate(task);
  if (!d) return task.time ?? "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatWeekDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  done:        { bg: "#dcfce7", text: "#16a34a", label: "Done" },
  "in-progress": { bg: "#fef9c3", text: "#ca8a04", label: "In Progress" },
  todo:        { bg: "#f1f5f9", text: "#64748b", label: "To Do" },
};

function StatusBadge({ status, theme }: { status: string; theme: any }) {
  const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.todo;
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: cfg.bg }]}>
      <Text style={[badgeStyles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}
const badgeStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  text: { fontSize: 11, fontWeight: "600" },
});

// ─── Task row ────────────────────────────────────────────────────────────────

function TaskRow({ task, theme }: { task: Task; theme: any }) {
  const timeStr = formatTimeDisplay(task);
  return (
    <View style={[taskRowStyles.row, { backgroundColor: theme.colors.surface }]}>
      <View style={[taskRowStyles.emoji, { backgroundColor: task.iconBg }]}>
        <Text style={taskRowStyles.emojiText}>{task.icon}</Text>
      </View>
      <View style={taskRowStyles.textWrap}>
        <Text style={[taskRowStyles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {task.title}
        </Text>
        {timeStr ? (
          <Text style={[taskRowStyles.time, { color: theme.colors.onSurfaceVariant }]}>
            {timeStr}
          </Text>
        ) : null}
      </View>
      <StatusBadge status={task.status} theme={theme} />
    </View>
  );
}
const taskRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  emoji: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 20 },
  textWrap:  { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  time: { fontSize: 12 },
});

// ─── Month Calendar Grid ──────────────────────────────────────────────────────

interface MonthGridProps {
  viewYear: number;
  viewMonth: number;
  selectedKey: string;
  dotMap: Map<string, string[]>; // dateKey → array of iconBg colors
  todayKey: string;
  onSelectDay: (key: string) => void;
  theme: any;
  primaryColor: string;
}

function MonthGrid({
  viewYear,
  viewMonth,
  selectedKey,
  dotMap,
  todayKey,
  onSelectDay,
  theme,
  primaryColor,
}: MonthGridProps) {
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }).map((_, idx) => {
    const day = idx - firstDay + 1;
    const valid = day >= 1 && day <= daysInMonth;
    const key = valid ? toDateKey(viewYear, viewMonth, day) : null;
    const isSelected = key === selectedKey;
    const isToday = key === todayKey;
    const dots = key ? dotMap.get(key) ?? [] : [];
    return { day, valid, key, isSelected, isToday, dots };
  });

  return (
    <View style={gridStyles.grid}>
      {cells.map((cell, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            gridStyles.cell,
            { width: CELL_SIZE, height: CELL_SIZE },
            cell.isSelected && { backgroundColor: primaryColor, borderRadius: CELL_SIZE / 2 },
            !cell.isSelected && cell.isToday && {
              borderRadius: CELL_SIZE / 2,
              borderWidth: 1.5,
              borderColor: primaryColor,
            },
          ]}
          onPress={() => cell.valid && cell.key && onSelectDay(cell.key)}
          activeOpacity={cell.valid ? 0.75 : 1}
        >
          <Text
            style={[
              gridStyles.cellText,
              {
                color: !cell.valid
                  ? "transparent"
                  : cell.isSelected
                  ? "#fff"
                  : cell.isToday
                  ? primaryColor
                  : theme.colors.onBackground,
              },
              (cell.isSelected || cell.isToday) && { fontWeight: "700" },
            ]}
          >
            {cell.valid ? cell.day : ""}
          </Text>

          {/* Dots */}
          {cell.valid && cell.dots.length > 0 && (
            <View style={gridStyles.dotRow}>
              {cell.dots.slice(0, 3).map((color, di) => (
                <View
                  key={di}
                  style={[
                    gridStyles.dot,
                    {
                      backgroundColor: cell.isSelected ? "rgba(255,255,255,0.85)" : color,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cellText: { fontSize: 14 },
  dotRow: {
    position: "absolute",
    bottom: 3,
    flexDirection: "row",
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});

// ─── Week Strip ───────────────────────────────────────────────────────────────

interface WeekStripProps {
  weekDates: Date[];
  selectedKey: string;
  dotMap: Map<string, string[]>;
  todayKey: string;
  onSelectDay: (key: string) => void;
  theme: any;
  primaryColor: string;
}

function WeekStrip({
  weekDates,
  selectedKey,
  dotMap,
  todayKey,
  onSelectDay,
  theme,
  primaryColor,
}: WeekStripProps) {
  return (
    <View style={weekStyles.strip}>
      {weekDates.map((date) => {
        const key = toDateKey(date.getFullYear(), date.getMonth(), date.getDate());
        const isSelected = key === selectedKey;
        const isToday = key === todayKey;
        const dots = dotMap.get(key) ?? [];
        const dayNum = date.getDate();
        const dayLabel = WEEKDAYS[date.getDay()];

        return (
          <TouchableOpacity
            key={key}
            style={[
              weekStyles.dayCol,
              isSelected && { backgroundColor: primaryColor, borderRadius: 14 },
            ]}
            onPress={() => onSelectDay(key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                weekStyles.dayLabel,
                {
                  color: isSelected
                    ? "rgba(255,255,255,0.8)"
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {dayLabel}
            </Text>
            <Text
              style={[
                weekStyles.dayNum,
                {
                  color: isSelected
                    ? "#fff"
                    : isToday
                    ? primaryColor
                    : theme.colors.onBackground,
                },
                (isSelected || isToday) && { fontWeight: "700" },
              ]}
            >
              {dayNum}
            </Text>
            {dots.length > 0 && (
              <View style={weekStyles.dotRow}>
                {dots.slice(0, 3).map((color, di) => (
                  <View
                    key={di}
                    style={[
                      weekStyles.dot,
                      {
                        backgroundColor: isSelected
                          ? "rgba(255,255,255,0.7)"
                          : color,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const weekStyles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 4,
  },
  dayLabel: { fontSize: 11, fontWeight: "500" },
  dayNum:   { fontSize: 16 },
  dotRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { tasks } = useTasks();
  const primaryColor = theme.colors.primary;

  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState(todayKey);

  // Week view: which Monday anchor
  const [weekAnchor, setWeekAnchor] = useState<Date>(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay()); // start of this week (Sunday)
    return d;
  });

  // Build dot map: dateKey → unique iconBg colors (up to 3)
  const dotMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const task of tasks) {
      const key = taskDateKey(task);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      const colors = map.get(key)!;
      if (!colors.includes(task.iconBg) && colors.length < 3) {
        colors.push(task.iconBg);
      }
    }
    return map;
  }, [tasks]);

  // Tasks for selected day
  const selectedDayTasks = useMemo(() => {
    return tasks
      .filter((t) => taskDateKey(t) === selectedKey)
      .sort((a, b) => {
        const da = parseDueDate(a)?.getTime() ?? 0;
        const db = parseDueDate(b)?.getTime() ?? 0;
        return da - db;
      });
  }, [tasks, selectedKey]);

  // Week dates for week view
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekAnchor);
      d.setDate(weekAnchor.getDate() + i);
      return d;
    });
  }, [weekAnchor]);

  // Selected date display
  const selectedDateDisplay = useMemo(() => {
    const [y, m, d] = selectedKey.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (selectedKey === todayKey) return "Today";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [selectedKey, todayKey]);

  // Navigation
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const prevWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  };
  const nextWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  };

  const handleSelectDay = (key: string) => {
    setSelectedKey(key);
    // If switching in month view, keep month in sync if user taps a different month's overflow
  };

  const goToToday = () => {
    setSelectedKey(todayKey);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    const anchor = new Date(today);
    anchor.setDate(anchor.getDate() - anchor.getDay());
    setWeekAnchor(anchor);
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.title}>Calendar</Text>
        <TouchableOpacity onPress={goToToday} style={styles.todayBtn}>
          <Text style={[styles.todayBtnText, { color: primaryColor }]}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* View mode toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.togglePill}>
          <TouchableOpacity
            style={[styles.toggleOpt, viewMode === "month" && { backgroundColor: primaryColor }]}
            onPress={() => setViewMode("month")}
          >
            <Text style={[styles.toggleOptText, viewMode === "month" && { color: "#fff" }]}>
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOpt, viewMode === "week" && { backgroundColor: primaryColor }]}
            onPress={() => setViewMode("week")}
          >
            <Text style={[styles.toggleOptText, viewMode === "week" && { color: "#fff" }]}>
              Week
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Month / Week Nav row */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={viewMode === "month" ? prevMonth : prevWeek}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.onBackground} />
          </TouchableOpacity>

          <Text style={styles.navLabel}>
            {viewMode === "month"
              ? `${MONTHS[viewMonth]} ${viewYear}`
              : `${formatWeekDayLabel(weekDates[0])} – ${formatWeekDayLabel(weekDates[6])}`}
          </Text>

          <TouchableOpacity
            onPress={viewMode === "month" ? nextMonth : nextWeek}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={22} color={theme.colors.onBackground} />
          </TouchableOpacity>
        </View>

        {/* Weekday header row */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={[styles.weekdayLabel, { color: theme.colors.onSurfaceVariant }]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar */}
        {viewMode === "month" ? (
          <MonthGrid
            viewYear={viewYear}
            viewMonth={viewMonth}
            selectedKey={selectedKey}
            dotMap={dotMap}
            todayKey={todayKey}
            onSelectDay={handleSelectDay}
            theme={theme}
            primaryColor={primaryColor}
          />
        ) : (
          <WeekStrip
            weekDates={weekDates}
            selectedKey={selectedKey}
            dotMap={dotMap}
            todayKey={todayKey}
            onSelectDay={handleSelectDay}
            theme={theme}
            primaryColor={primaryColor}
          />
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.colors.surface }]} />

        {/* Selected day heading */}
        <View style={styles.dayHeadingRow}>
          <Text style={[styles.dayHeading, { color: theme.colors.onBackground }]}>
            {selectedDateDisplay}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: primaryColor + "18" }]}>
            <Text style={[styles.countBadgeText, { color: primaryColor }]}>
              {selectedDayTasks.length}{" "}
              {selectedDayTasks.length === 1 ? "task" : "tasks"}
            </Text>
          </View>
        </View>

        {/* Task list */}
        {selectedDayTasks.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayEmoji}>📭</Text>
            <Text style={[styles.emptyDayText, { color: theme.colors.onSurfaceVariant }]}>
              Nothing scheduled
            </Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {selectedDayTasks.map((task) => (
              <TaskRow key={task.id} task={task} theme={theme} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      position: "relative",
    },
    backBtn: {
      position: "absolute",
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    todayBtn: {
      position: "absolute",
      right: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    todayBtnText: {
      fontSize: 13,
      fontWeight: "600",
    },
    toggleRow: {
      alignItems: "center",
      marginVertical: 10,
    },
    togglePill: {
      flexDirection: "row",
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 3,
    },
    toggleOpt: {
      paddingHorizontal: 28,
      paddingVertical: 8,
      borderRadius: 10,
    },
    toggleOptText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
    },
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    navLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onBackground,
      flex: 1,
      textAlign: "center",
    },
    weekdayRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      marginBottom: 4,
    },
    weekdayLabel: {
      width: CELL_SIZE,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "600",
      paddingVertical: 4,
    },
    divider: {
      height: 8,
      marginTop: 16,
      marginBottom: 4,
    },
    dayHeadingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    dayHeading: {
      fontSize: 17,
      fontWeight: "700",
    },
    countBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    countBadgeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    taskList: {
      paddingHorizontal: 20,
    },
    emptyDay: {
      alignItems: "center",
      paddingTop: 32,
      gap: 8,
    },
    emptyDayEmoji: {
      fontSize: 36,
    },
    emptyDayText: {
      fontSize: 15,
    },
  });