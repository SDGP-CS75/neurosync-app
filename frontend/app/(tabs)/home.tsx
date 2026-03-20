import React from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { useTasks } from "../../context/TasksContext";

const { width } = Dimensions.get("window");

const FALLBACK_ICON_BG = "#E8E4FF";

function getTaskProgress(task: {
  status: "done" | "in-progress" | "todo";
  subtasks?: { isDone: boolean }[];
}) {
  if (task.subtasks && task.subtasks.length > 0) {
    const completedSubtasks = task.subtasks.filter((subtask) => subtask.isDone).length;
    return completedSubtasks / task.subtasks.length;
  }

  if (task.status === "done") return 1;
  if (task.status === "in-progress") return 0.5;
  return 0;
}

// Circular Progress Component
interface CircularProgressProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  progressColor: string;
  bgColor?: string;
}

function CircularProgress({
  percentage,
  size,
  strokeWidth,
  progressColor,
  bgColor = "#E0E0E0",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.progressTextContainer]}>
        <Text style={[styles.progressText, { color: "#fff" }]}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

// Small Circular Progress for Task Groups
interface SmallCircularProgressProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  progressColor: string;
  bgColor?: string;
  textColor?: string;
}

function SmallCircularProgress({
  percentage,
  size,
  strokeWidth,
  progressColor,
  bgColor = "#E0E0E0",
  textColor = "#333",
}: SmallCircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.progressTextContainer]}>
        <Text style={[styles.smallProgressText, { color: textColor }]}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const { profile } = useUser();
  const { tasks } = useTasks();
  const router = useRouter();

  const todayKey = new Date().toISOString().slice(0, 10);
  const displayName = profile.name || "You";
  const displayInitials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("") || "Y";

  const todayTasks = tasks.filter((task) => task.dateKey === todayKey);
  const completedToday = todayTasks.filter((task) => task.status === "done").length;
  const todayCompletion = todayTasks.length
    ? Math.round((completedToday / todayTasks.length) * 100)
    : 0;
  const remainingToday = todayTasks.length - completedToday;

  const inProgressTasks = tasks
    .filter((task) => task.status === "in-progress")
    .map((task) => ({
      id: task.id,
      category: task.category || "Uncategorized",
      title: task.title,
      progress: getTaskProgress(task),
      color: theme.colors.primary,
      icon: task.icon || "📝",
      iconBg: task.iconBg || FALLBACK_ICON_BG,
    }));

  const taskGroups = Array.from(
    tasks.reduce((map, task) => {
      const key = task.category || "Uncategorized";
      const current = map.get(key) ?? {
        id: key,
        title: key,
        tasks: 0,
        doneTasks: 0,
        icon: task.icon || "📝",
        iconBg: task.iconBg || FALLBACK_ICON_BG,
      };

      current.tasks += 1;
      if (task.status === "done") current.doneTasks += 1;

      map.set(key, current);
      return map;
    }, new Map<string, {
      id: string;
      title: string;
      tasks: number;
      doneTasks: number;
      icon: string;
      iconBg: string;
    }>())
  )
    .map(([, group]) => ({
      ...group,
      progress: group.tasks ? Math.round((group.doneTasks / group.tasks) * 100) : 0,
    }))
    .sort((a, b) => b.tasks - a.tasks);

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerLeft}
              onPress={() => router.push("/(tabs)/settings")}
              activeOpacity={0.7}
            >
              <View style={{ alignItems: "center" }}>
                {profile.profileImage ? (
                  <Image source={{ uri: profile.profileImage }} style={styles.headerAvatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.avatarInitials}>{displayInitials}</Text>
                  </View>
                )}
              </View>

              <View style={styles.greeting}>
                <Text style={[styles.helloText, { color: theme.colors.onSurfaceVariant }]}>
                  Hello!
                </Text>
                <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
                  {displayName}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          </View>

          {/* Swipeable cards: Today's Task + Mood Tracking widget */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 10 }}
            // contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {/* Today's Task Card (centered, inset) */}
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.todayCard, { width: width - 48 }]}
            >
              <View style={styles.todayCardContent}>
                <View style={styles.todayCardLeft}>
                  <Text style={styles.todayCardTitle}>
                    {todayTasks.length === 0
                      ? "No tasks planned\nyet for today"
                      : todayCompletion === 100
                        ? "Today's tasks are\nall completed!"
                        : `${remainingToday} task${remainingToday === 1 ? "" : "s"} left\nto finish today`}
                  </Text>
                  <TouchableOpacity style={styles.viewTaskBtn} onPress={() => router.push('/(tabs)/todo-list' as any)}>
                    <Text style={[styles.viewTaskText, { color: theme.colors.primary }]}>View Task</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.todayCardRight}>
                  <TouchableOpacity style={styles.chatIcon}>
                    <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                  </TouchableOpacity>
                  <AnimatedCircularProgress
                    style={{ marginRight: 15 }}
                    size={102}
                    width={9}
                    fill={85}
                    rotation={0}
                    lineCap="round"
                    tintColor="#fff"
                    backgroundColor="#8A78F3"
                    duration={1200}
                    easing={Easing.out(Easing.ease)}
                >
                    {() => <Text style={styles.progressText}>{85}%</Text>}
                  </AnimatedCircularProgress>
                </View>
              </View>
            </LinearGradient>

            {/* Mood Tracking Widget Card (centered, inset) */}
            <LinearGradient
              colors={[theme.colors.secondary, theme.colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.todayCard, { width: width - 48, marginHorizontal: 12 }]}
            >
              <View style={styles.todayCardContent}>
                <View style={styles.todayCardLeft}>
                  <Text style={[styles.todayCardTitle, { color: '#fff' }]}>Mood Check-in</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', marginTop: 8 }}>
                    Quick mood snapshot to help track how you feel.
                  </Text>
                  <TouchableOpacity
                    style={[styles.viewTaskBtn, { marginTop: 12 }]}
                    onPress={() => router.push('/(tabs)/mood-analysis' as any)}
                  >
                    <Text style={[styles.viewTaskText, { color: theme.colors.primary }]}>Your Mood Analysis</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.todayCardRight}>
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Text style={{ fontSize: 36 }}>😊</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ScrollView>

          {/* In Progress Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                In Progress
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{inProgressTasks.length}</Text>
              </View>
            </View>
            {inProgressTasks.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.emptyCardText, { color: theme.colors.onSurfaceVariant }]}>
                  No tasks are in progress right now.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.inProgressScroll}
              >
                {inProgressTasks.map((task) => (
                  <View
                    key={task.id}
                    style={[styles.inProgressCard, { backgroundColor: theme.colors.surface }]}
                  >
                    <View style={styles.inProgressHeader}>
                      <Text
                        style={[
                          styles.inProgressCategory,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {task.category}
                      </Text>
                      <View
                        style={[
                          styles.categoryIcon,
                          { backgroundColor: task.iconBg },
                        ]}
                      >
                        <Text style={styles.categoryEmoji}>{task.icon}</Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.inProgressTitle, { color: theme.colors.onSurface }]}
                      numberOfLines={2}
                    >
                      {task.title}
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: theme.colors.surfaceVariant },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor: theme.colors.primary,
                              width: `${task.progress * 100}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Task Groups Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Task Groups
              </Text>
            </View>
            {taskGroups.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.emptyCardText, { color: theme.colors.onSurfaceVariant }]}>
                  Create a task to see your groups here.
                </Text>
              </View>
            ) : (
              taskGroups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[styles.taskGroupCard, { backgroundColor: theme.colors.surface }]}
                >
                  <View style={[styles.taskGroupIcon, { backgroundColor: group.iconBg }]}>
                    <Text style={styles.taskGroupEmoji}>{group.icon}</Text>
                  </View>
                  <View style={styles.taskGroupInfo}>
                    <Text style={[styles.taskGroupTitle, { color: theme.colors.onSurface }]}>
                      {group.title}
                    </Text>
                    <Text style={[styles.taskGroupCount, { color: theme.colors.onSurfaceVariant }]}>
                      {group.tasks} {group.tasks === 1 ? "Task" : "Tasks"}
                    </Text>
                  </View>
                  <SmallCircularProgress
                    percentage={group.progress}
                    size={45}
                    strokeWidth={4}
                    progressColor={theme.colors.primary}
                    bgColor={theme.colors.surfaceVariant}
                    textColor={theme.colors.onSurface}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
          
          {/* Bottom spacing for nav */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
      <Nav />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    alignItems: 'center',
    justifyContent: 'center' 
  },
  avatarInitials: { 
    color: '#fff', 
    fontWeight: '700' 
  },
  greeting: {
    marginLeft: 8,
  },
  helloText: {
    fontSize: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
  },
  notificationBtn: {
    padding: 8,
  },
  todayCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },
  todayCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  todayCardLeft: {
    flex: 1,
  },
  todayCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 26,
    marginBottom: 15,
  },
  viewTaskBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  viewTaskText: {
    fontWeight: "600",
    fontSize: 14,
  },
  todayCardRight: {
    alignItems: "flex-end",
  },
  chatIcon: {
    marginBottom: 8,
    opacity: 0.8,
  },
  progressTextContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  // In Progress Section Styles
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: "#5838b5",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  inProgressScroll: {
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  inProgressCard: {
    width: width * 0.6,
    padding: 15,
    borderRadius: 16,
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 5,
    marginTop: 1,
  },
  inProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  inProgressCategory: {
    fontSize: 12,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryEmoji: {
    fontSize: 14,
  },
  inProgressTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    lineHeight: 20,
  },
  progressBarContainer: {
    marginTop: 5,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  // Task Groups Section Styles
  smallProgressText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  taskGroupCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskGroupIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  taskGroupEmoji: {
    fontSize: 20,
  },
  taskGroupInfo: {
    flex: 1,
  },
  taskGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  taskGroupCount: {
    fontSize: 12,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 16,
  },
  emptyCardText: {
    fontSize: 14,
  },
});
