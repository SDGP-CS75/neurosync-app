import React from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G } from "react-native-svg";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────
// Circular Progress Component
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// Small Circular Progress for Task Groups
// ─────────────────────────────────────────────────────────────────
function SmallCircularProgress({
  percentage,
  color,
}: {
  percentage: number;
  color: string;
}) {
  const size = 45;
  const strokeWidth = 4;
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
            stroke={color + "30"}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.progressTextContainer]}>
        <Text style={[styles.smallProgressText, { color }]}>{percentage}%</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────
const inProgressTasks = [
  {
    id: 1,
    category: "Office Project",
    title: "Grocery shopping app design",
    progress: 0.7,
    color: "#5838b5",
    icon: "briefcase",
  },
  {
    id: 2,
    category: "Personal Project",
    title: "Uber Eats redesign challenge",
    progress: 0.4,
    color: "#E91E63",
    icon: "person",
  },
];

const taskGroups = [
  {
    id: 1,
    title: "Office Project",
    tasks: 23,
    progress: 70,
    color: "#E91E63",
    icon: "briefcase",
    bgColor: "#FCE4EC",
  },
  {
    id: 2,
    title: "Office Project",
    tasks: 30,
    progress: 70,
    color: "#E91E63",
    icon: "briefcase",
    bgColor: "#FCE4EC",
  },
  {
    id: 3,
    title: "Daily Study",
    tasks: 30,
    progress: 87,
    color: "#FF9800",
    icon: "book",
    bgColor: "#FFF3E0",
  },
];

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { theme } = useAppTheme();

  return (
    <LinearGradient
      colors={["#fef6e4", "#f0e6ff", "#e6f0ff", "#e6fff0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={{
                  uri: "https://i.pravatar.cc/100?img=12",
                }}
                style={styles.avatar}
              />
              <View style={styles.greeting}>
                <Text style={[styles.helloText, { color: theme.colors.onSurfaceVariant }]}>
                  Hello!
                </Text>
                <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
                  Desmond Miles
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          </View>

          {/* Today's Task Card */}
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.todayCard}
          >
            <View style={styles.todayCardContent}>
              <View style={styles.todayCardLeft}>
                <Text style={styles.todayCardTitle}>
                  Your today's task{"\n"}almost done!
                </Text>
                <TouchableOpacity style={styles.viewTaskBtn}>
                  <Text style={[styles.viewTaskText, { color: theme.colors.primary }]}>
                    View Task
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.todayCardRight}>
                <TouchableOpacity style={styles.chatIcon}>
                  <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                </TouchableOpacity>
                <CircularProgress
                  percentage={85}
                  size={90}
                  strokeWidth={8}
                  progressColor="#fff"
                  bgColor="rgba(255,255,255,0.3)"
                />
              </View>
            </View>
          </LinearGradient>

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
                        { backgroundColor: task.color + "20" },
                      ]}
                    >
                      <Ionicons name={task.icon as any} size={14} color={task.color} />
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
                        { backgroundColor: task.color + "30" },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            backgroundColor: task.color,
                            width: `${task.progress * 100}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Task Groups Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Task Groups
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{taskGroups.length}</Text>
              </View>
            </View>
            {taskGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[styles.taskGroupCard, { backgroundColor: theme.colors.surface }]}
              >
                <View style={styles.taskGroupLeft}>
                  <View
                    style={[styles.taskGroupIcon, { backgroundColor: group.bgColor }]}
                  >
                    <MaterialCommunityIcons
                      name={group.icon as any}
                      size={20}
                      color={group.color}
                    />
                  </View>
                  <View style={styles.taskGroupInfo}>
                    <Text
                      style={[styles.taskGroupTitle, { color: theme.colors.onSurface }]}
                    >
                      {group.title}
                    </Text>
                    <Text
                      style={[
                        styles.taskGroupTasks,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {group.tasks} Tasks
                    </Text>
                  </View>
                </View>
                <SmallCircularProgress percentage={group.progress} color={group.color} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom spacing for nav */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
      <Nav />
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
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

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
  greeting: {},
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

  // Today's Task Card
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
    backgroundColor: "#fff",
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

  // Progress
  progressTextContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  smallProgressText: {
    fontSize: 10,
    fontWeight: "bold",
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  badge: {
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },

  // In Progress Cards
  inProgressScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  inProgressCard: {
    width: width * 0.45,
    padding: 15,
    borderRadius: 16,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  inProgressTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 15,
    lineHeight: 21,
  },
  progressBarContainer: {
    marginTop: "auto",
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

  // Task Groups
  taskGroupCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskGroupLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskGroupIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  taskGroupInfo: {},
  taskGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  taskGroupTasks: {
    fontSize: 13,
  },
});