import React from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";

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
          
          {/* Bottom spacing for nav */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
      <Nav />
    </LinearGradient>
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
});