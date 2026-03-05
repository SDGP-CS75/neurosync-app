import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.7, 280);

// Timer presets in minutes
const FOCUS_PRESETS = [15, 25, 30, 45, 60];
const BREAK_PRESETS = [5, 10, 15];

type TimerMode = "focus" | "break";

export default function FocusTimer() {
  const { theme } = useAppTheme();

  // Timer state
  const [mode, setMode] = useState<TimerMode>("focus");
  const [focusDuration, setFocusDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Animation
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get total duration based on mode
  const getTotalDuration = useCallback(() => {
    return (mode === "focus" ? focusDuration : breakDuration) * 60;
  }, [mode, focusDuration, breakDuration]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress (0 to 1)
  const getProgress = useCallback(() => {
    const total = getTotalDuration();
    return timeLeft / total;
  }, [timeLeft, getTotalDuration]);

  // Update progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: getProgress(),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, progressAnim, getProgress]);

  // Pulse animation when running
  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning, pulseAnim]);

  // Timer countdown logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer completed
      Vibration.vibrate([0, 500, 200, 500]);
      setIsRunning(false);

      if (mode === "focus") {
        setSessionsCompleted((prev) => prev + 1);
        // Switch to break mode
        setMode("break");
        setTimeLeft(breakDuration * 60);
      } else {
        // Switch back to focus mode
        setMode("focus");
        setTimeLeft(focusDuration * 60);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, focusDuration, breakDuration]);

  // Control functions
  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getTotalDuration());
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === "focus") {
      setMode("break");
      setTimeLeft(breakDuration * 60);
    } else {
      setMode("focus");
      setTimeLeft(focusDuration * 60);
    }
  };

  const handleDurationChange = (duration: number) => {
    if (mode === "focus") {
      setFocusDuration(duration);
      if (!isRunning) {
        setTimeLeft(duration * 60);
      }
    } else {
      setBreakDuration(duration);
      if (!isRunning) {
        setTimeLeft(duration * 60);
      }
    }
  };

  // Progress circle interpolation
  const progressInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: theme.colors.onBackground }}>Focus Timer</Text>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 }}>
          <Ionicons name="flame" size={16} color={theme.colors.primary} />
          <Text style={{ fontSize: 14, color: theme.colors.onSurface, fontWeight: "500" }}>{sessionsCompleted} sessions</Text>
        </View>
      </View>

      {/* Mode Toggle */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 16, paddingHorizontal: 24 }}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, backgroundColor: mode === "focus" ? theme.colors.primary : theme.colors.surface }}
          onPress={() => {
            if (!isRunning) {
              setMode("focus");
              setTimeLeft(focusDuration * 60);
            }
          }}
          disabled={isRunning}
        >
          <Ionicons name="bulb" size={20} color={mode === "focus" ? "#fff" : theme.colors.onSurface} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: mode === "focus" ? "#fff" : theme.colors.onSurface }}>Focus</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, backgroundColor: mode === "break" ? theme.colors.primary : theme.colors.surface }}
          onPress={() => {
            if (!isRunning) {
              setMode("break");
              setTimeLeft(breakDuration * 60);
            }
          }}
          disabled={isRunning}
        >
          <Ionicons name="cafe" size={20} color={mode === "break" ? "#fff" : theme.colors.onSurface} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: mode === "break" ? "#fff" : theme.colors.onSurface }}>Break</Text>
        </TouchableOpacity>
      </View>

      {/* Timer Display */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Animated.View
          style={{
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
            backgroundColor: theme.colors.surface,
            justifyContent: "center",
            alignItems: "center",
            transform: [{ scale: pulseAnim }],
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <Text style={{ color: theme.colors.onSurface, fontSize: 56, fontWeight: "bold" }}>
            {formatTime(timeLeft)}
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 16, marginTop: 4 }}>
            {mode === "focus" ? "Stay focused!" : "Take a break"}
          </Text>
        </Animated.View>
      </View>

      {/* Duration Presets */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 12, textAlign: "center" }}>
          {mode === "focus" ? "Focus Duration" : "Break Duration"}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}>
          {(mode === "focus" ? FOCUS_PRESETS : BREAK_PRESETS).map((duration) => (
            <TouchableOpacity
              key={duration}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: (mode === "focus" ? focusDuration : breakDuration) === duration ? theme.colors.primary : theme.colors.surface,
                minWidth: 50,
                alignItems: "center",
              }}
              onPress={() => handleDurationChange(duration)}
              disabled={isRunning}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: (mode === "focus" ? focusDuration : breakDuration) === duration ? "#fff" : theme.colors.onSurface }}>
                {duration}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Control Buttons */}
      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 24, paddingBottom: 24 }}>
        <TouchableOpacity style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.surface, justifyContent: "center", alignItems: "center" }} onPress={handleReset}>
          <Ionicons name="refresh" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center", shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }} onPress={handleStartPause}>
          <Ionicons name={isRunning ? "pause" : "play"} size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.surface, justifyContent: "center", alignItems: "center" }} onPress={handleSkip}>
          <Ionicons name="play-skip-forward" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <Nav />
    </SafeAreaView>
  );
}