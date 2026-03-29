import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { getSessions, FocusSession } from "../../services/sessionStorage";
import { useFadeIn, useSlideUp } from "../../utils/animations";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Tab = "log" | "byTask";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateHeader(isoDate: string): string {
  const d = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (today.getTime() - target.getTime()) / 86400000
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatTimeOfDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function isoDateKey(iso: string): string {
  return iso.split("T")[0]; // "YYYY-MM-DD"
}

// ─── Log Tab ──────────────────────────────────────────────────────────────────

interface LogSection {
  title: string; // human label
  dateKey: string;
  data: FocusSession[];
}

function LogTab({
  sessions,
  theme,
}: {
  sessions: FocusSession[];
  theme: any;
}) {
  // Group sessions by date
  const sections: LogSection[] = React.useMemo(() => {
    const map = new Map<string, FocusSession[]>();
    for (const s of sessions) {
      if (s.mode !== "focus") continue; // only show focus sessions in log
      const key = isoDateKey(s.startedAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([key, data]) => ({
      title: formatDateHeader(data[0].startedAt),
      dateKey: key,
      data,
    }));
  }, [sessions]);

  const s = logStyles(theme);

  if (sections.length === 0) {
    return (
      <View style={s.empty}>
        <Ionicons name="time-outline" size={48} color={theme.colors.onSurfaceVariant} />
        <Text style={s.emptyText}>No sessions yet</Text>
        <Text style={s.emptySub}>
          Complete a focus session to see it here.
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
      renderSectionHeader={({ section }) => (
        <View style={s.sectionHeader}>
          <Text style={s.sectionHeaderText}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={s.row}>
          <View style={s.iconWrap}>
            <Ionicons name="bulb" size={18} color={theme.colors.primary} />
          </View>
          <View style={s.rowText}>
            <Text style={s.rowTitle} numberOfLines={1}>
              {item.taskTitle ?? "Free focus"}
            </Text>
            <Text style={s.rowSub}>{formatTimeOfDay(item.startedAt)}</Text>
          </View>
          <View style={s.durationBadge}>
            <Text style={s.durationText}>
              {formatDuration(item.durationMinutes)}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const logStyles = (theme: any) =>
  StyleSheet.create({
    list: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    sectionHeader: {
      paddingTop: 20,
      paddingBottom: 8,
    },
    sectionHeaderText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.onSurfaceVariant,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
      gap: 12,
      boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.07)",
      elevation: 2,
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: theme.colors.primary + "18",
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    rowSub: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    durationBadge: {
      backgroundColor: theme.colors.primary + "18",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
    },
    durationText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 10,
    },
    emptyText: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    emptySub: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      paddingHorizontal: 40,
    },
  });

// ─── By Task Tab ──────────────────────────────────────────────────────────────

interface TaskSummary {
  taskId: string | null;
  taskTitle: string;
  totalMinutes: number;
  sessionCount: number;
}

function ByTaskTab({
  sessions,
  theme,
}: {
  sessions: FocusSession[];
  theme: any;
}) {
  const summaries: TaskSummary[] = React.useMemo(() => {
    const map = new Map<string, TaskSummary>();

    for (const s of sessions) {
      if (s.mode !== "focus") continue;
      const key = s.taskId ?? "__free__";
      if (!map.has(key)) {
        map.set(key, {
          taskId: s.taskId,
          taskTitle: s.taskTitle ?? "Free focus",
          totalMinutes: 0,
          sessionCount: 0,
        });
      }
      const entry = map.get(key)!;
      entry.totalMinutes += s.durationMinutes;
      entry.sessionCount += 1;
    }

    return Array.from(map.values()).sort(
      (a, b) => b.totalMinutes - a.totalMinutes
    );
  }, [sessions]);

  const s = byTaskStyles(theme);

  const maxMinutes = summaries[0]?.totalMinutes ?? 1;

  if (summaries.length === 0) {
    return (
      <View style={s.empty}>
        <Ionicons name="bar-chart-outline" size={48} color={theme.colors.onSurfaceVariant} />
        <Text style={s.emptyText}>No sessions yet</Text>
        <Text style={s.emptySub}>
          Sessions grouped by task will appear here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={summaries}
      keyExtractor={(item) => item.taskId ?? "__free__"}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => {
        const barWidth = (item.totalMinutes / maxMinutes) * (SCREEN_WIDTH - 80);
        return (
          <View style={s.card}>
            {/* Rank + title row */}
            <View style={s.cardHeader}>
              <View style={s.rankBadge}>
                <Text style={s.rankText}>{index + 1}</Text>
              </View>
              <View style={s.cardTitleWrap}>
                <Text style={s.cardTitle} numberOfLines={1}>
                  {item.taskTitle}
                </Text>
                <Text style={s.cardSub}>
                  {item.sessionCount}{" "}
                  {item.sessionCount === 1 ? "session" : "sessions"}
                </Text>
              </View>
              <Text style={s.totalTime}>
                {formatDuration(item.totalMinutes)}
              </Text>
            </View>

            {/* Bar */}
            <View style={s.barTrack}>
              <View
                style={[
                  s.barFill,
                  {
                    width: barWidth,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        );
      }}
    />
  );
}

const byTaskStyles = (theme: any) =>
  StyleSheet.create({
    list: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 40,
      gap: 10,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.07)",
      elevation: 2,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    rankBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    rankText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    cardTitleWrap: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    cardSub: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    totalTime: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    barTrack: {
      height: 6,
      backgroundColor: theme.colors.background,
      borderRadius: 3,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 3,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 10,
    },
    emptyText: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    emptySub: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      paddingHorizontal: 40,
    },
  });

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SessionHistory() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { userId } = useTasks();
  
  // Animation hooks
  const fadeAnim = useFadeIn(300, 100);
  const { slideAnim } = useSlideUp(400, 200);

  const [activeTab, setActiveTab] = useState<Tab>("log");
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError("Please sign in to view your session history");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getSessions(userId);
      setSessions(data);
    } catch (e) {
      console.warn("loadSessions error:", e);
      setError("Failed to load sessions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ── Summary bar ─────────────────────────────────────────────────────────────

  const todayKey = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter(
    (s) => s.mode === "focus" && isoDateKey(s.startedAt) === todayKey
  );
  const todayMinutes = todaySessions.reduce(
    (sum, s) => sum + s.durationMinutes,
    0
  );
  const todayCount = todaySessions.length;

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.title}>Session History</Text>
        <TouchableOpacity onPress={loadSessions} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Ionicons name="today-outline" size={18} color={theme.colors.primary} />
          <View>
            <Text style={styles.summaryValue}>
              {formatDuration(todayMinutes)}
            </Text>
            <Text style={styles.summaryLabel}>Today's focus</Text>
          </View>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Ionicons name="flame-outline" size={18} color={theme.colors.secondary} />
          <View>
            <Text style={styles.summaryValue}>{todayCount}</Text>
            <Text style={styles.summaryLabel}>
              {todayCount === 1 ? "Session" : "Sessions"} today
            </Text>
          </View>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Ionicons name="bar-chart-outline" size={18} color={theme.colors.onSurfaceVariant} />
          <View>
            <Text style={styles.summaryValue}>{sessions.filter((s) => s.mode === "focus").length}</Text>
            <Text style={styles.summaryLabel}>Total sessions</Text>
          </View>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "log" && styles.tabActive]}
          onPress={() => setActiveTab("log")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "log" && styles.tabTextActive,
            ]}
          >
            Log
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "byTask" && styles.tabActive]}
          onPress={() => setActiveTab("byTask")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "byTask" && styles.tabTextActive,
            ]}
          >
            By Task
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSessions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === "log" ? (
        <LogTab sessions={sessions} theme={theme} />
      ) : (
        <ByTaskTab sessions={sessions} theme={theme} />
      )}
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
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
      boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
      elevation: 2,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    refreshBtn: {
      position: "absolute",
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
      elevation: 2,
    },
    // Summary bar
    summaryBar: {
      flexDirection: "row",
      backgroundColor: theme.colors.surface,
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      justifyContent: "space-around",
      boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.08)",
      elevation: 3,
    },
    summaryItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    summaryLabel: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginTop: 1,
    },
    summaryDivider: {
      width: 1,
      height: 32,
      backgroundColor: theme.colors.background,
    },
    // Tabs
    tabRow: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginBottom: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 9,
      alignItems: "center",
      borderRadius: 10,
    },
    tabActive: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
    },
    tabTextActive: {
      color: "#fff",
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    errorWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 10,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      textAlign: "center",
      paddingHorizontal: 40,
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
    },
    retryButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
    },
  });