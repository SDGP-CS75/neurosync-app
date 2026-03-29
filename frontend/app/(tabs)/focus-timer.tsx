import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";
import TaskPicker from "../../components/TaskPicker";
import { Task, useTasks } from "../../context/TasksContext";
import { Easings } from "../../utils/animations";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Timer presets in minutes
const FOCUS_PRESETS = [15, 25, 30, 45, 60];
const BREAK_PRESETS = [5, 10, 15];

type TimerMode = "focus" | "break";

export default function FocusTimer() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();       // ← moved inside component
  const { tasks } = useTasks();                // ← moved inside component

  // Setup state
  const [mode, setMode] = useState<TimerMode>("focus");
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [customFocusInput, setCustomFocusInput] = useState("");
  const [customBreakInput, setCustomBreakInput] = useState("");

  // Linked task state
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [linkedTask, setLinkedTask] = useState<Task | null | undefined>(
    undefined
  );

  // Animation values
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const descriptionFade = useRef(new Animated.Value(0)).current;
  const descriptionSlide = useRef(new Animated.Value(20)).current;
  const workingOnFade = useRef(new Animated.Value(0)).current;
  const workingOnSlide = useRef(new Animated.Value(30)).current;
  const modeFade = useRef(new Animated.Value(0)).current;
  const modeSlide = useRef(new Animated.Value(30)).current;
  const durationFade = useRef(new Animated.Value(0)).current;
  const durationSlide = useRef(new Animated.Value(30)).current;
  const previewFade = useRef(new Animated.Value(0)).current;
  const previewSlide = useRef(new Animated.Value(30)).current;
  const startFade = useRef(new Animated.Value(0)).current;
  const startSlide = useRef(new Animated.Value(30)).current;
  const tipsFade = useRef(new Animated.Value(0)).current;
  const tipsSlide = useRef(new Animated.Value(30)).current;

  // Entrance animations
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 120,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 120,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(descriptionFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(descriptionSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(workingOnFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(workingOnSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(modeFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(modeSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(durationFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(durationSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(previewFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(previewSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(startFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(startSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(tipsFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(tipsSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Pre-fill linked task from daily plan navigation  ← moved inside component
  useEffect(() => {
    const preId = params.preselectedTaskId
      ? String(params.preselectedTaskId)
      : null;
    if (preId) {
      const found = tasks.find((t) => t.id === preId) ?? null;
      setLinkedTask(found);
    }
  }, []);

  // Auto-set focus duration when a task is selected
  useEffect(() => {
    if (linkedTask) {
      // Calculate total duration from task (check both durationMinutes and totalDurationMinutes)
      let totalMinutes = linkedTask.durationMinutes || (linkedTask as any).totalDurationMinutes;
      
      if (!totalMinutes && linkedTask.subtasks && linkedTask.subtasks.length > 0) {
        // Sum up all subtask durations
        totalMinutes = linkedTask.subtasks.reduce((sum, st) => {
          return sum + (st.durationMinutes || 0);
        }, 0);
      }
      
      // Only set if we have a valid duration
      if (totalMinutes && totalMinutes > 0) {
        // Clamp to reasonable focus session limits (5-180 minutes)
        const clampedDuration = Math.min(Math.max(totalMinutes, 5), 180);
        setFocusDuration(clampedDuration);
        setCustomFocusInput("");
      }
    }
  }, [linkedTask]);

  const handleStartTimer = () => {
    router.push({
      pathname: "/focus-timer-counting",
      params: {
        mode,
        focusDuration: focusDuration.toString(),
        breakDuration: breakDuration.toString(),
        taskId: linkedTask?.id ?? "",
        taskTitle: linkedTask?.title ?? "",
      },
    });
  };

  const handleDurationChange = (duration: number) => {
    if (mode === "focus") {
      setFocusDuration(duration);
      setCustomFocusInput("");
    } else {
      setBreakDuration(duration);
      setCustomBreakInput("");
    }
  };

  const handleCustomDurationChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    if (mode === "focus") {
      setCustomFocusInput(numericValue);
      if (numericValue) {
        const value = Math.min(Math.max(parseInt(numericValue) || 1, 1), 180);
        setFocusDuration(value);
      }
    } else {
      setCustomBreakInput(numericValue);
      if (numericValue) {
        const value = Math.min(Math.max(parseInt(numericValue) || 1, 1), 60);
        setBreakDuration(value);
      }
    }
  };

  const isCustomValue = () => {
    const currentDuration = mode === "focus" ? focusDuration : breakDuration;
    const presets = mode === "focus" ? FOCUS_PRESETS : BREAK_PRESETS;
    return !presets.includes(currentDuration);
  };

  const linkedTaskLabel =
    linkedTask === undefined
      ? "Choose a task (optional)"
      : linkedTask === null
      ? "Free focus — no task linked"
      : linkedTask.title;

  const linkedTaskIcon =
    linkedTask === undefined
      ? "link-outline"
      : linkedTask === null
      ? "infinite-outline"
      : null;

  const styles = createStyles(theme, mode);

  return (
    <SafeAreaView style={styles.container}>
      <TaskPicker
        visible={showTaskPicker}
        onClose={() => setShowTaskPicker(false)}
        onSelect={(task) => setLinkedTask(task)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <Text style={styles.title}>Focus Timer</Text>
        </Animated.View>

        <Animated.Text
          style={[
            styles.description,
            {
              opacity: descriptionFade,
              transform: [{ translateY: descriptionSlide }],
            },
          ]}
        >
          Set up your focus and break durations, then start your session.
        </Animated.Text>

        <Animated.View
          style={[
            styles.workingOnSection,
            {
              opacity: workingOnFade,
              transform: [{ translateY: workingOnSlide }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Working on</Text>
          <TouchableOpacity
            style={styles.workingOnRow}
            onPress={() => setShowTaskPicker(true)}
            activeOpacity={0.8}
          >
            {linkedTask ? (
              <View
                style={[
                  styles.taskEmojiBadge,
                  { backgroundColor: linkedTask.iconBg },
                ]}
              >
                <Text style={styles.taskEmoji}>{linkedTask.icon}</Text>
              </View>
            ) : (
              <View style={styles.taskIconWrap}>
                <Ionicons
                  name={linkedTaskIcon!}
                  size={20}
                  color={
                    linkedTask === null
                      ? theme.colors.secondary
                      : theme.colors.onSurfaceVariant
                  }
                />
              </View>
            )}

            <Text
              style={[
                styles.workingOnLabel,
                linkedTask !== undefined && linkedTask !== null
                  ? { color: theme.colors.onSurface, fontWeight: "600" }
                  : { color: theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {linkedTaskLabel}
            </Text>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          {linkedTask !== undefined && (
            <TouchableOpacity
              style={styles.clearTaskBtn}
              onPress={() => setLinkedTask(undefined)}
            >
              <Text style={styles.clearTaskText}>Clear</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.modeContainer,
            {
              opacity: modeFade,
              transform: [{ translateY: modeSlide }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === "focus" && styles.modeButtonActive,
            ]}
            onPress={() => setMode("focus")}
          >
            <Ionicons
              name="bulb"
              size={24}
              color={mode === "focus" ? "#fff" : theme.colors.onSurface}
            />
            <Text
              style={[
                styles.modeText,
                mode === "focus" && styles.modeTextActive,
              ]}
            >
              Focus
            </Text>
            <Text
              style={[
                styles.modeDuration,
                mode === "focus" && styles.modeDurationActive,
              ]}
            >
              {focusDuration} min
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === "break" && styles.modeButtonActive,
            ]}
            onPress={() => setMode("break")}
          >
            <Ionicons
              name="cafe"
              size={24}
              color={mode === "break" ? "#fff" : theme.colors.onSurface}
            />
            <Text
              style={[
                styles.modeText,
                mode === "break" && styles.modeTextActive,
              ]}
            >
              Break
            </Text>
            <Text
              style={[
                styles.modeDuration,
                mode === "break" && styles.modeDurationActive,
              ]}
            >
              {breakDuration} min
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.durationSection,
            {
              opacity: durationFade,
              transform: [{ translateY: durationSlide }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>
            {mode === "focus" ? "Focus Duration" : "Break Duration"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsScrollContent}
          >
            {(mode === "focus" ? FOCUS_PRESETS : BREAK_PRESETS).map(
              (duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.presetButton,
                    (mode === "focus" ? focusDuration : breakDuration) ===
                      duration &&
                      !isCustomValue() &&
                      styles.presetButtonActive,
                  ]}
                  onPress={() => handleDurationChange(duration)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      (mode === "focus" ? focusDuration : breakDuration) ===
                        duration &&
                        !isCustomValue() &&
                        styles.presetTextActive,
                    ]}
                  >
                    {duration}
                  </Text>
                  <Text
                    style={[
                      styles.presetUnit,
                      (mode === "focus" ? focusDuration : breakDuration) ===
                        duration &&
                        !isCustomValue() &&
                        styles.presetTextActive,
                    ]}
                  >
                    min
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>

          <View style={styles.customInputContainer}>
            <Text style={styles.customInputLabel}>Or set custom time:</Text>
            <View
              style={[
                styles.customInputWrapper,
                isCustomValue() && styles.customInputWrapperActive,
              ]}
            >
              <TextInput
                style={styles.customInput}
                placeholder={mode === "focus" ? "1-180" : "1-60"}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                keyboardType="number-pad"
                maxLength={3}
                value={mode === "focus" ? customFocusInput : customBreakInput}
                onChangeText={handleCustomDurationChange}
              />
              <Text style={styles.customInputUnit}>min</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.previewSection,
            {
              opacity: previewFade,
              transform: [{ translateY: previewSlide }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Session Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewRow}>
              <View style={styles.previewItem}>
                <Ionicons name="bulb" size={20} color={theme.colors.primary} />
                <Text style={styles.previewLabel}>Focus</Text>
                <Text style={styles.previewValue}>{focusDuration} min</Text>
              </View>
              <View style={styles.previewDivider} />
              <View style={styles.previewItem}>
                <Ionicons name="cafe" size={20} color={theme.colors.secondary} />
                <Text style={styles.previewLabel}>Break</Text>
                <Text style={styles.previewValue}>{breakDuration} min</Text>
              </View>
              <View style={styles.previewDivider} />
              <View style={styles.previewItem}>
                <Ionicons name="time" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.previewLabel}>Total</Text>
                <Text style={styles.previewValue}>
                  {focusDuration + breakDuration} min
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            {
              opacity: startFade,
              transform: [{ translateY: startSlide }],
            },
          ]}
        >
          <TouchableOpacity style={styles.startButton} onPress={handleStartTimer}>
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.startButtonText}>Start Focus Session</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.tipsSection,
            {
              opacity: tipsFade,
              transform: [{ translateY: tipsSlide }],
            },
          ]}
        >
          <Text style={styles.tipsTitle}>💡 Tips for better focus</Text>
          <Text style={styles.tipText}>• Put your phone on Do Not Disturb</Text>
          <Text style={styles.tipText}>• Close unnecessary tabs and apps</Text>
          <Text style={styles.tipText}>• Have water nearby to stay hydrated</Text>
        </Animated.View>
      </ScrollView>

      <Nav />
    </SafeAreaView>
  );
}

const createStyles = (theme: any, mode: TimerMode) =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingBottom: 80 },
    header: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 4,
      position: "relative",
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.colors.onBackground,
      textAlign: "center",
    },
    description: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      paddingHorizontal: 24,
      marginBottom: 12,
      textAlign: "center",
    },
    workingOnSection: { paddingHorizontal: 24, marginBottom: 16 },
    workingOnRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
      boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
      elevation: 2,
    },
    taskEmojiBadge: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    taskEmoji: { fontSize: 18 },
    taskIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: theme.colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    workingOnLabel: { flex: 1, fontSize: 14 },
    clearTaskBtn: { alignSelf: "flex-end", marginTop: 6, paddingHorizontal: 4 },
    clearTaskText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textDecorationLine: "underline",
    },
    modeContainer: {
      flexDirection: "row",
      paddingHorizontal: 24,
      paddingVertical: 4,
      gap: 12,
    },
    modeButton: {
      flex: 1,
      alignItems: "center",
      padding: 20,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      gap: 8,
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      elevation: 3,
    },
    modeButtonActive: {
      backgroundColor:
        mode === "focus" ? theme.colors.primary : theme.colors.secondary,
    },
    modeText: { fontSize: 16, fontWeight: "600", color: theme.colors.onSurface },
    modeTextActive: { color: "#fff" },
    modeDuration: { fontSize: 12, color: theme.colors.onSurfaceVariant },
    modeDurationActive: { color: "rgba(255,255,255,0.8)" },
    durationSection: { marginTop: 12, marginBottom: 4 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onBackground,
      marginBottom: 10,
      paddingHorizontal: 24,
    },
    presetsScrollContent: { paddingHorizontal: 24, paddingVertical: 10, gap: 10 },
    presetButton: {
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      minWidth: 65,
      boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
      elevation: 2,
    },
    presetButtonActive: {
      backgroundColor:
        mode === "focus" ? theme.colors.primary : theme.colors.secondary,
    },
    presetText: { fontSize: 18, fontWeight: "bold", color: theme.colors.onSurface },
    presetUnit: { fontSize: 12, color: theme.colors.onSurfaceVariant },
    presetTextActive: { color: "#fff" },
    customInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      paddingHorizontal: 24,
    },
    customInputLabel: { fontSize: 14, color: theme.colors.onSurfaceVariant },
    customInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 6,
      borderWidth: 2,
      borderColor: "transparent",
    },
    customInputWrapperActive: {
      borderColor:
        mode === "focus" ? theme.colors.primary : theme.colors.secondary,
    },
    customInput: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
      minWidth: 50,
      textAlign: "center",
    },
    customInputUnit: { fontSize: 14, color: theme.colors.onSurfaceVariant },
    previewSection: { paddingHorizontal: 24, marginTop: 16, marginBottom: 8 },
    previewCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      elevation: 3,
    },
    previewRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    previewItem: { alignItems: "center", gap: 6 },
    previewLabel: { fontSize: 12, color: theme.colors.onSurfaceVariant },
    previewValue: { fontSize: 16, fontWeight: "600", color: theme.colors.onSurface },
    previewDivider: { width: 1, height: 40, backgroundColor: theme.colors.background },
    startButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      backgroundColor: theme.colors.primary,
      marginHorizontal: 24,
      marginTop: 16,
      paddingVertical: 16,
      borderRadius: 16,
      boxShadow: `0px 4px 8px ${theme.colors.primary}4D`,
      elevation: 6,
    },
    startButtonText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
    tipsSection: {
      paddingHorizontal: 24,
      marginTop: 20,
      marginBottom: 30,
      backgroundColor: theme.colors.surface,
      marginHorizontal: 24,
      borderRadius: 16,
      padding: 20,
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      elevation: 3,
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 12,
    },
    tipText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
      lineHeight: 20,
    },
  });
