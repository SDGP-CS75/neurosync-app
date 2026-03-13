import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { Easing } from "react-native";
import * as Progress from "react-native-progress";
import { router } from "expo-router";
export default function AppLayout() {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header />
          <TodayTaskCard />
          <InProgress />
          <TaskGroups />
        </ScrollView>
      </View>

      <Nav />
    </SafeAreaView>
  );
}

/* ================= HEADER ================= */

const Header = () => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color="#fff" />
        </View>

        <View>
          <Text style={styles.greeting}>Hello!</Text>
          <Text style={styles.username}>Desmond Miles</Text>
        </View>
      </View>

      <Ionicons name="notifications-outline" size={24} color="#444" />
    </View>
  );
};

/* ================= TODAY TASK CARD ================= */

const TodayTaskCard = () => {
  return (
    <View style={styles.todayCard}>
      <View>
        <Text style={styles.todayText}>
          Your today's task{"\n"}almost done!
        </Text>

        <TouchableOpacity style={styles.taskButton}>
          <Text style={styles.taskButtonText}>View Task</Text>
        </TouchableOpacity>
      </View>

      <AnimatedCircularProgress
        style={{ marginRight: 15 }}
        size={102}
        width={9}
        fill={85}
        tintColor="#fff"
        backgroundColor="#8A78F3"
        duration={1200}
        easing={Easing.out(Easing.ease)}
      >
        {() => <Text style={styles.progressText}>{`85%`}</Text>}
      </AnimatedCircularProgress>

      <TouchableOpacity 
        style={styles.moreButton}
        onPress={() => router.push("/(tabs)/todo-list" as any)}
      >
        <Ionicons name="ellipsis-horizontal" size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

/* ================= IN PROGRESS ================= */

const InProgress = () => {
  return (
    <View style={{ marginTop: 25 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>In Progress</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>6</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <ProgressCard
          title="Office Project"
          description="Grocery shopping app design"
          progress={0.75}
          color="#3B82F6"
          background="#d9e6f2"
        />

        <ProgressCard
          title="Personal Project"
          description="Uber Eats redesign challange"
          progress={0.45}
          color="#F97316"
          background="#f1d6cd"
        />
      </View>
    </View>
  );
};

type ProgressCardProps = {
  title: string;
  description: string;
  progress: number;
  color: string;
  background: string;
};

const ProgressCard = ({
  title,
  description,
  progress,
  color,
  background,
}: ProgressCardProps) => {
  return (
    <View style={[styles.progressCard, { backgroundColor: background }]}>
      <Text style={styles.cardLabel}>{title}</Text>

      <Text style={styles.cardTitle}>{description}</Text>

      <Progress.Bar
        progress={progress}
        width={null}
        height={6}
        borderRadius={4}
        borderWidth={0}
        color={color}
        unfilledColor="#eee"
      />
    </View>
  );
};

/* ================= TASK GROUPS ================= */

const TaskGroups = () => {
  return (
    <View style={{ marginTop: 28 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Task Groups</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>4</Text>
        </View>
      </View>

      <TaskGroupCard
        icon="work"
        title="Office Project"
        tasks="23 Tasks"
        progress={70}
        color="#ec4899"
        iconBg="#FCE7F3"
      />

      <TaskGroupCard
        icon="lock"
        title="Office Project"
        tasks="30 Tasks"
        progress={70}
        color="#7c3aed"
        iconBg="#EDE9FE"
      />

      <TaskGroupCard
        icon="menu-book"
        title="Daily Study"
        tasks="50 Tasks"
        progress={87}
        color="#F97316"
        iconBg="#FEF3C7"
      />
    </View>
  );
};

type TaskGroupCardProps = {
  icon: any;
  title: string;
  tasks: string;
  progress: number;
  color: string;
  iconBg: string;
};

const TaskGroupCard = ({
  icon,
  title,
  tasks,
  progress,
  color,
  iconBg,
}: TaskGroupCardProps) => {
  return (
    <View style={styles.groupCard}>
      <View style={styles.groupLeft}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={20} color="#555" />
        </View>

        <View>
          <Text style={styles.groupTitle}>{title}</Text>
          <Text style={styles.groupTasks}>{tasks}</Text>
        </View>
      </View>

      <AnimatedCircularProgress
        size={40}
        width={5}
        fill={progress}
        tintColor={color}
        backgroundColor="#eee"
        duration={1000}
        easing={Easing.out(Easing.ease)}
      >
        {() => <Text style={{ fontSize: 10 }}>{progress}%</Text>}
      </AnimatedCircularProgress>
    </View>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F8FC",
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#A29BFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  greeting: {
    fontSize: 14,
    color: "#888",
  },

  username: {
    fontSize: 20,
    fontWeight: "700",
  },

  todayCard: {
    marginTop: 20,
    backgroundColor: "#6C5BA1",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  todayText: {
    color: "white",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "500",
    width: 190,
  },

  taskButton: {
    marginTop: 18,
    backgroundColor: "#F2EFFE",
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 13,
    alignSelf: "flex-start",
  },

  taskButtonText: {
    color: "#6A5AE0",
    fontWeight: "600",
    fontSize: 15,
  },

  progressText: {
    color: "white",
    fontWeight: "700",
    fontSize: 20,
  },
  
  moreButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 6,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  badge: {
    marginLeft: 6,
    backgroundColor: "#A29BFE",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  badgeText: {
    color: "white",
    fontSize: 12,
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  progressCard: {
    width: "48%",
    padding: 16,
    borderRadius: 18,
  },

  cardLabel: {
    fontSize: 12,
    color: "#666",
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginVertical: 6,
  },

  groupCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  groupLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  groupTitle: {
    fontWeight: "600",
  },

  groupTasks: {
    fontSize: 12,
    color: "#888",
  },
});
