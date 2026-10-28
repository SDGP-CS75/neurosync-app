import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "../context/ThemeContext";
import { useTasks, Task } from "../context/TasksContext";
import { apiRequest } from "../services/apiClient";
import { getUserTimeZone } from "../utils/dates";

const DEFAULT_AVAILABLE_MINUTES = 480; // 8 hours

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDueDate(task: Task): string {
  if (!task.dueDate) return task.time ?? "";
  try {
    const d = new Date(task.dueDate);
    if (isNaN(d.getTime())) return task.time ?? "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(d);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return task.time ?? "";
  }
}

// ─── Task plan card ───────────────────────────────────────────────────────────

interface PlanCardProps {
  task: Task;
  rank: number;
  reasoning: string;
  theme: any;
  onStart: (task: Task) => void;
}

function PlanCard({ task, rank, reasoning, theme, onStart }: PlanCardProps) {
  const dueStr = formatDueDate(task);
  const subtaskTotal = task.subtasks?.length ?? 0;
  const subtaskDone = task.subtasks?.filter((s) => s.isDone).length ?? 0;

  return (
    <View style={[cardStyles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Rank bubble + icon */}
      <View style={cardStyles.leftCol}>
        <View style={[cardStyles.rankBubble, { backgroundColor: theme.colors.primary + "18" }]}>
          <Text style={[cardStyles.rankNum, { color: theme.colors.primary }]}>{rank}</Text>
        </View>
        <View style={[cardStyles.iconWrap, { backgroundColor: task.iconBg }]}>
          <Text style={cardStyles.iconEmoji}>{task.icon}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={cardStyles.content}>
        <View style={cardStyles.titleRow}>
          <Text
            style={[cardStyles.title, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          {dueStr ? (
            <Text style={[cardStyles.due, { color: theme.colors.onSurfaceVariant }]}>
              {dueStr}
            </Text>
          ) : null}
        </View>

        {/* Meta row */}
        <View style={cardStyles.metaRow}>
          <View
            style={[
              cardStyles.categoryBadge,
              { backgroundColor: theme.colors.primary + "14" },
            ]}
          >
            <Text style={[cardStyles.categoryText, { color: theme.colors.primary }]}>
              {task.category}
            </Text>
          </View>
          {subtaskTotal > 0 && (
            <Text style={[cardStyles.subtaskMeta, { color: theme.colors.onSurfaceVariant }]}>
              {subtaskDone}/{subtaskTotal} steps
            </Text>
          )}
        </View>

        {/* AI reasoning */}
        {reasoning ? (
          <View style={[cardStyles.reasoningRow, { backgroundColor: theme.colors.background }]}>
            <Ionicons
              name="sparkles"
              size={12}
              color={theme.colors.primary}
              style={{ marginTop: 1 }}
            />
            <Text
              style={[cardStyles.reasoningText, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {reasoning}
            </Text>
          </View>
        ) : null}

        {/* Start button */}
        <TouchableOpacity
          style={[cardStyles.startBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => onStart(task)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Start ${task.title}`}
        >
          <Ionicons name="play" size={14} color="#fff" />
          <Text style={cardStyles.startBtnText}>Start this task</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    marginBottom: 10,
    padding: 14,
    gap: 12,
    boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.07)',
    elevation: 2,
  },
  leftCol: {
    alignItems: "center",
    gap: 6,
  },
  rankBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNum: {
    fontSize: 13,
    fontWeight: "700",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: 20 },
  content: { flex: 1, gap: 6 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  due: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  subtaskMeta: {
    fontSize: 12,
  },
  reasoningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  reasoningText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 2,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface DailyPlanResponse {
  orderedTaskIds: string[];
  reasoning: Record<string, string>;
}

function getPlanTaskPayload(tasks: Task[]) {
  return tasks
    .filter((task) => task.status !== "done")
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((task) => ({
      id: task.id,
      title: task.title,
      category: task.category,
      status: task.status,
      dueDate: task.dueDate,
      sessionTime: task.sessionTime,
      subtasks: task.subtasks?.map((subtask) => ({
        text: subtask.text,
        isDone: subtask.isDone,
      })),
    }));
}

export default function DailyPlanScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { tasks, userId } = useTasks();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DailyPlanResponse | null>(null);
  const latestTasksRef = useRef<Task[]>(tasks);
  const requestIdRef = useRef(0);

  latestTasksRef.current = tasks;

  // Incomplete tasks only
  const incompleteTasks = useMemo(
    () => tasks.filter((t) => t.status !== "done"),
    [tasks]
  );
  const planTaskPayload = useMemo(
    () => getPlanTaskPayload(incompleteTasks),
    [incompleteTasks]
  );
  const planTaskSignature = useMemo(
    () => JSON.stringify(planTaskPayload),
    [planTaskPayload]
  );

  // Ordered tasks from plan (fall back to original order if plan not loaded)
  const orderedTasks: Task[] = plan
    ? (plan.orderedTaskIds
        .map((id) => incompleteTasks.find((t) => t.id === id))
        .filter(Boolean) as Task[])
    : incompleteTasks;

  const fetchPlan = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const requestedTasks = getPlanTaskPayload(latestTasksRef.current);

    if (requestedTasks.length === 0) {
      setPlan(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<{
        orderedTaskIds?: string[];
        reasoning?: Record<string, string>;
      }>("/api/ai/daily-plan", {
        method: "POST",
        body: JSON.stringify({
          tasks: requestedTasks,
          availableMinutes: DEFAULT_AVAILABLE_MINUTES,
          userId: userId ?? undefined,
          timeZone: getUserTimeZone(),
        }),
      });

      if (requestId !== requestIdRef.current) return;
      setPlan({
        orderedTaskIds: Array.isArray(data.orderedTaskIds) ? data.orderedTaskIds : [],
        reasoning:      typeof data.reasoning === "object" ? data.reasoning : {},
      });
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchPlan();
    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchPlan, planTaskSignature]);

  // Navigate to focus timer with task pre-linked
  const handleStartTask = (task: Task) => {
    router.push({
      pathname: "/(tabs)/focus-timer",
      params: {
        preselectedTaskId:    task.id,
        preselectedTaskTitle: task.title,
      },
    });
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Daily Plan</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={fetchPlan}
          style={styles.refreshBtn}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Refresh daily plan"
          accessibilityState={{ busy: loading, disabled: loading }}
        >
          <Ionicons
            name="refresh"
            size={22}
            color={loading ? theme.colors.onSurfaceVariant + "55" : theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      {/* Available time badge */}
      <View style={styles.availBadgeRow}>
        <View style={[styles.availBadge, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="time-outline" size={15} color={theme.colors.primary} />
          <Text style={[styles.availBadgeText, { color: theme.colors.onSurface }]}>
            {formatDuration(DEFAULT_AVAILABLE_MINUTES)} available today
          </Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Building your plan…
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error ?? "#ef4444"} />
          <Text style={[styles.errorText, { color: theme.colors.error ?? "#ef4444" }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={fetchPlan}
            accessibilityRole="button"
            accessibilityLabel="Try building the daily plan again"
          >
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : orderedTasks.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
            All clear!
          </Text>
          <Text style={[styles.emptySub, { color: theme.colors.onSurfaceVariant }]}>
            You have no pending tasks for today.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orderedTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            plan ? (
              <View style={[styles.aiNotice, { backgroundColor: theme.colors.primary + "12" }]}>
                <Ionicons name="sparkles" size={14} color={theme.colors.primary} />
                <Text style={[styles.aiNoticeText, { color: theme.colors.primary }]}>
                  AI-ordered by priority, due dates, and your focus patterns
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <PlanCard
              task={item}
              rank={index + 1}
              reasoning={plan?.reasoning[item.id] ?? ""}
              theme={theme}
              onStart={handleStartTask}
            />
          )}
        />
      )}
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
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
      boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.08)',
      elevation: 2,
    },
    headerCenter: {
      alignItems: "center",
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
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
    },
    availBadgeRow: {
      alignItems: "center",
      paddingVertical: 12,
    },
    availBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.06)',
      elevation: 1,
    },
    availBadgeText: {
      fontSize: 13,
      fontWeight: "600",
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    },
    loadingText: {
      fontSize: 15,
    },
    errorWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 40,
    },
    errorText: {
      fontSize: 15,
      textAlign: "center",
    },
    retryBtn: {
      marginTop: 4,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    retryBtnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
    },
    emptySub: {
      fontSize: 14,
      textAlign: "center",
      paddingHorizontal: 40,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 48,
    },
    aiNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 10,
      marginBottom: 14,
    },
    aiNoticeText: {
      fontSize: 13,
      fontWeight: "500",
      flex: 1,
    },
  });
