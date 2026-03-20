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
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";

const { width } = Dimensions.get("window");

// Mock Data
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
    progress: 78,
    color: "#5838b5",
    icon: "briefcase",
  },
  {
    id: 2,
    title: "Personal Project",
    tasks: 12,
    progress: 45,
    color: "#E91E63",
    icon: "person",
  },
  {
    id: 3,
    title: "Daily Study",
    tasks: 8,
    progress: 92,
    color: "#4CAF50",
    icon: "book",
  },
];

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
  const router = useRouter();

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
              <View style={{ alignItems: 'center' }}>
                {useUser()?.profile?.profileImage ? (
                  <Image source={{ uri: useUser()?.profile?.profileImage }} style={styles.headerAvatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.avatarInitials}>{(useUser()?.profile?.name || 'You').split(' ').map((p: string) => p[0]).slice(0, 2).join('')}</Text>
                  </View>
                )}
              </View>

              <View style={styles.greeting}>
                <Text style={[styles.helloText, { color: theme.colors.onSurfaceVariant }]}>
                  Hello!
                </Text>
                <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
                  {profile.name}
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
                    Your today's task{"\n"}almost done!
                  </Text>
                  <TouchableOpacity style={styles.viewTaskBtn} onPress={() => router.push('/(tabs)/todo-list' as any)}>
                    <Text style={[styles.viewTaskText, { color: theme.colors.primary }]}>View Task</Text>
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
            </View>
            {taskGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[styles.taskGroupCard, { backgroundColor: theme.colors.surface }]}
              >
                <View style={[styles.taskGroupIcon, { backgroundColor: group.color + "20" }]}>
                  <Ionicons name={group.icon as any} size={20} color={group.color} />
                </View>
                <View style={styles.taskGroupInfo}>
                  <Text style={[styles.taskGroupTitle, { color: theme.colors.onSurface }]}>
                    {group.title}
                  </Text>
                  <Text style={[styles.taskGroupCount, { color: theme.colors.onSurfaceVariant }]}>
                    {group.tasks} Tasks
                  </Text>
                </View>
                <SmallCircularProgress
                  percentage={group.progress}
                  size={45}
                  strokeWidth={4}
                  progressColor={group.color}
                  bgColor={group.color + "30"}
                  textColor={theme.colors.onSurface}
                />
              </TouchableOpacity>
            ))}
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
    marginHorizontal: -20,
    paddingHorizontal: 20,
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
});