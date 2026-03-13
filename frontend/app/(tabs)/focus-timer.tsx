import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedCircularProgress } from "react-native-circular-progress";
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

  const styles = createStyles(theme, mode);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
        <Text style={styles.title}>Focus Timer</Text>
        <View style={styles.sessionBadge}>
          <Ionicons name="flame" size={16} color={theme.colors.primary} />
          <Text style={styles.sessionText}>{sessionsCompleted} sessions</Text>
        </View>
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeButton, mode === "focus" && styles.modeButtonActive]}
          onPress={() => {
            if (!isRunning) {
              setMode("focus");
              setTimeLeft(focusDuration * 60);
            }
          }}
          disabled={isRunning}
        >
          <Ionicons
            name="bulb"
            size={20}
            color={mode === "focus" ? "#fff" : theme.colors.onSurface}
          />
          <Text style={[styles.modeText, mode === "focus" && styles.modeTextActive]}>
            Focus
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === "break" && styles.modeButtonActive]}
          onPress={() => {
            if (!isRunning) {
              setMode("break");
              setTimeLeft(breakDuration * 60);
            }
          }}
          disabled={isRunning}
        >
          <Ionicons
            name="cafe"
            size={20}
            color={mode === "break" ? "#fff" : theme.colors.onSurface}
          />
          <Text style={[styles.modeText, mode === "break" && styles.modeTextActive]}>
            Break
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Animated.View
          style={[
            styles.timerCircle,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <AnimatedCircularProgress
            size={CIRCLE_SIZE}
            width={8}
            fill={getProgress() * 100}
            rotation={0}
            lineCap="round"
            tintColor={mode === "focus" ? theme.colors.primary : theme.colors.secondary}
            backgroundColor={theme.colors.background}
            duration={isRunning ? 1000 : 300}
          >
            {() => (
              <View style={styles.timerContent}>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                <Text style={styles.timerLabel}>
                  {mode === "focus" ? "Stay focused!" : "Take a break"}
                </Text>
                
                {/* Control Buttons inside circle */}
                <View style={styles.controlsContainer}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
                    <Ionicons name="refresh" size={20} color={theme.colors.onSurface} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.primaryButton} onPress={handleStartPause}>
                    <Ionicons
                      name={isRunning ? "pause" : "play"}
                      size={24}
                      color="#fff"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
                    <Ionicons name="play-skip-forward" size={20} color={theme.colors.onSurface} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </AnimatedCircularProgress>
        </Animated.View>
      </View>

      {/* Duration Presets */}
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsLabel}>
          {mode === "focus" ? "Focus Duration" : "Break Duration"}
        </Text>
        <View style={styles.presetsList}>
          {(mode === "focus" ? FOCUS_PRESETS : BREAK_PRESETS).map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.presetButton,
                (mode === "focus" ? focusDuration : breakDuration) === duration &&
                  styles.presetButtonActive,
              ]}
              onPress={() => handleDurationChange(duration)}
              disabled={isRunning}
            >
              <Text
                style={[
                  styles.presetText,
                  (mode === "focus" ? focusDuration : breakDuration) === duration &&
                    styles.presetTextActive,
                ]}
              >
                {duration}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </ScrollView>

      <Nav />
    </SafeAreaView>
  );
}

const createStyles = (theme: any, mode: TimerMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 100,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.colors.onBackground,
    },
    sessionBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 4,
    },
    sessionText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: "500",
    },
    modeContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginTop: 16,
      paddingHorizontal: 24,
    },
    modeButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
      backgroundColor: theme.colors.surface,
    },
    modeButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    modeText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    modeTextActive: {
      color: "#fff",
    },
    timerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
      marginBottom: 30,
      minHeight: 320,
    },
    timerCircle: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },

    timerContent: {
      alignItems: "center",
    },
    timerText: {
      fontSize: 56,
      fontWeight: "bold",
      color: theme.colors.onSurface,
      fontVariant: ["tabular-nums"],
    },
    timerLabel: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    presetsContainer: {
      paddingHorizontal: 24,
      marginTop: 20,
      marginBottom: 60,
    },
    presetsLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 20,
      textAlign: "center",
    },
    presetsList: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 10,
    },
    presetButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      minWidth: 50,
      alignItems: "center",
    },
    presetButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    presetText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    presetTextActive: {
      color: "#fff",
    },
    controlsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
      marginTop: 12,
    },
    primaryButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    secondaryButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      justifyContent: "center",
      alignItems: "center",
    },
  });