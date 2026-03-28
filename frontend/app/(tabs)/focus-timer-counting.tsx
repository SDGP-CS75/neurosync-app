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
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  StatusBar,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import Svg, { Circle } from "react-native-svg";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";
import BreakActivityModal from "../../components/BreakActivityModal";
import { useTasks, SubTask } from "../../context/TasksContext";
import { writeSession, FocusSession } from "../../services/sessionStorage";
import { scheduleTaskNotification, cancelTaskNotification } from "../../services/notifications";

// ─── Animated Circular Progress ──────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  size: number;
  width: number;
  fill: number;
  tintColor: string;
  backgroundColor: string;
  duration?: number;
  children?: React.ReactNode;
}

function CustomAnimatedCircularProgress({
  size,
  width,
  fill,
  tintColor,
  backgroundColor,
  duration = 300,
  children,
}: CircularProgressProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - width) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: fill,
      duration,
      useNativeDriver: false,
    }).start();
  }, [fill, duration]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={width}
          fill="transparent"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={tintColor}
          strokeWidth={width}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      {children}
    </View>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.7, 280);
const SCREEN_SAVER_TIMEOUT = 10000;

type MusicStream = {
  id: string;
  name: string;
  url: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const MUSIC_STREAMS: MusicStream[] = [
  {
    id: "lofi",
    name: "Lo-Fi Beats",
    url: "https://streams.ilovemusic.de/iloveradio17.mp3",
    icon: "musical-notes",
  },
  {
    id: "piano",
    name: "Piano Chill",
    url: "https://streams.ilovemusic.de/iloveradio10.mp3",
    icon: "musical-note",
  },
  {
    id: "ambient",
    name: "Ambient",
    url: "https://streams.ilovemusic.de/iloveradio19.mp3",
    icon: "cloudy-night",
  },
  {
    id: "rain",
    name: "Rain Sounds",
    url: "https://rainymood.com/audio1112/0.m4a",
    icon: "rainy",
  },
  {
    id: "chillout",
    name: "Chillout",
    url: "https://streams.ilovemusic.de/iloveradio7.mp3",
    icon: "heart",
  },
  {
    id: "jazz",
    name: "Smooth Jazz",
    url: "https://streams.ilovemusic.de/iloveradio14.mp3",
    icon: "wine",
  },
];

type TimerMode = "focus" | "break";

// ─── Subtask Completion Prompt ────────────────────────────────────────────────

interface SubtaskPromptProps {
  visible: boolean;
  subtasks: SubTask[];
  taskTitle: string;
  onToggle: (subtaskId: string) => void;
  onProceed: () => void;
  theme: any;
}

function SubtaskCompletionPrompt({
  visible,
  subtasks,
  taskTitle,
  onToggle,
  onProceed,
  theme,
}: SubtaskPromptProps) {
  const incomplete = subtasks.filter((s) => !s.isDone);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={promptStyles.overlay}>
        <View
          style={[
            promptStyles.sheet,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={[promptStyles.handle, { backgroundColor: theme.colors.outline }]} />

          <Text style={[promptStyles.title, { color: theme.colors.onSurface }]}>
            Great focus session! 🎉
          </Text>
          <Text style={[promptStyles.sub, { color: theme.colors.onSurfaceVariant }]}>
            Did you complete any steps for{" "}
            <Text style={{ fontWeight: "700" }}>{taskTitle}</Text>?
          </Text>

          {incomplete.length === 0 ? (
            <View style={promptStyles.allDoneRow}>
              <Ionicons
                name="checkmark-circle"
                size={28}
                color={theme.colors.primary}
              />
              <Text
                style={[promptStyles.allDoneText, { color: theme.colors.primary }]}
              >
                All subtasks done!
              </Text>
            </View>
          ) : (
            <FlatList
              data={incomplete}
              keyExtractor={(item) => item.id}
              style={promptStyles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    promptStyles.subtaskRow,
                    { borderBottomColor: theme.colors.outline + "44" },
                  ]}
                  onPress={() => onToggle(item.id)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      promptStyles.checkbox,
                      {
                        borderColor: theme.colors.primary,
                        backgroundColor: item.isDone
                          ? theme.colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    {item.isDone && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text
                    style={[
                      promptStyles.subtaskText,
                      {
                        color: item.isDone
                          ? theme.colors.onSurfaceVariant
                          : theme.colors.onSurface,
                        textDecorationLine: item.isDone
                          ? "line-through"
                          : "none",
                      },
                    ]}
                  >
                    {item.text}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          <View style={promptStyles.buttonRow}>
            <TouchableOpacity
              style={[
                promptStyles.skipBtn,
                { borderColor: theme.colors.outline },
              ]}
              onPress={onProceed}
            >
              <Text
                style={[
                  promptStyles.skipBtnText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Skip
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                promptStyles.doneBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={onProceed}
            >
              <Text style={promptStyles.doneBtnText}>Done → Break</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const promptStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: "75%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  allDoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },
  allDoneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    maxHeight: 220,
    marginBottom: 20,
  },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  subtaskText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
  },
  skipBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  doneBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FocusTimerCounting() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tasks, toggleSubtaskDone, logFocusSession, userId } = useTasks();

  // Params
  const initialMode = (params.mode as TimerMode) || "focus";
  const initialFocusDuration = params.focusDuration
    ? Number(params.focusDuration)
    : 25;
  const initialBreakDuration = params.breakDuration
    ? Number(params.breakDuration)
    : 5;
  const linkedTaskId = params.taskId ? String(params.taskId) : null;
  const linkedTaskTitle = params.taskTitle ? String(params.taskTitle) : null;

  // Derive linked task subtasks live from context
  const linkedTask = linkedTaskId
    ? tasks.find((t) => t.id === linkedTaskId) ?? null
    : null;

  // Timer state
  const [mode, setMode] = useState<TimerMode>(initialMode);
  const [focusDuration] = useState(initialFocusDuration);
  const [breakDuration] = useState(initialBreakDuration);
  const [timeLeft, setTimeLeft] = useState(
    initialMode === "focus"
      ? initialFocusDuration * 60
      : initialBreakDuration * 60
  );
  const [isRunning, setIsRunning] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Session tracking
  const sessionStartRef = useRef<Date>(new Date());

  // Subtask prompt state (shown when focus session ends)
  const [showSubtaskPrompt, setShowSubtaskPrompt] = useState(false);
  const [pendingSubtaskToggles, setPendingSubtaskToggles] = useState<
    Record<string, boolean>
  >({});
  const [completedFocusMinutes, setCompletedFocusMinutes] = useState(0);

  // Break activity modal
  const [showBreakActivity, setShowBreakActivity] = useState(false);

  // Music state
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [selectedStream, setSelectedStream] = useState<MusicStream>(MUSIC_STREAMS[0]);
  const soundRef = useRef<AudioPlayer | null>(null);
  
  // Screen saver state
  const [showScreenSaver, setShowScreenSaver] = useState(false);
  const screenSaverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenSaverAnim = useRef(new Animated.Value(0)).current;

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  // ── Screen saver ────────────────────────────────────────────────────────────

  const resetScreenSaverTimeout = useCallback(() => {
    if (screenSaverTimeout.current) clearTimeout(screenSaverTimeout.current);

    if (showScreenSaver) {
      Animated.timing(screenSaverAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowScreenSaver(false));
    }

    if (isRunning) {
      screenSaverTimeout.current = setTimeout(() => {
        setShowScreenSaver(true);
        Animated.timing(screenSaverAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, SCREEN_SAVER_TIMEOUT);
    }
  }, [showScreenSaver, isRunning, screenSaverAnim]);

  useEffect(() => {
    if (isRunning) {
      resetScreenSaverTimeout();
    } else {
      if (screenSaverTimeout.current) clearTimeout(screenSaverTimeout.current);
      if (showScreenSaver) {
        Animated.timing(screenSaverAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowScreenSaver(false));
      }
    }
    return () => {
      if (screenSaverTimeout.current) clearTimeout(screenSaverTimeout.current);
    };
  }, [isRunning]);

  // ── Audio setup ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        });
      } catch (error) {
        console.log("Error setting audio mode:", error);
      }
    };
    setupAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.remove();
        soundRef.current = null;
      }
    };
  }, []);

  const stopMusic = async () => {
    try {
      if (soundRef.current) {
        soundRef.current.pause();
        await soundRef.current.seekTo(0);
        soundRef.current.remove();
        soundRef.current = null;
      }
      setIsMusicOn(false);
    } catch (error) {
      console.log("Error stopping music:", error);
    }
  };

  const playMusicStream = async (stream: MusicStream) => {
    if (isMusicLoading) return;
    setSelectedStream(stream);
    setShowMusicPicker(false);
    setIsMusicLoading(true);

    try {
      if (soundRef.current) {
        const cur = soundRef.current;
        soundRef.current = null;
        try {
          cur.pause();
          await cur.seekTo(0);
        } catch (e) {
          // Ignore pause/seek errors
        }

        try {
          cur.remove();
        } catch (e) {
          // Ignore cleanup errors
        }

        // Small delay to ensure audio system is ready
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const sound = createAudioPlayer({ uri: stream.url });
      sound.loop = true;
      sound.volume = 0.5;
      sound.play();

      soundRef.current = sound;
      setIsMusicOn(true);
      setIsMusicLoading(false);
    } catch (error) {
      console.log("Error playing music:", error);
      setIsMusicLoading(false);
      setIsMusicOn(false);
    }
  };

  useEffect(() => {
    const handleMusicWithTimer = async () => {
      if (soundRef.current && isMusicOn) {
        try {
          if (isRunning) {
            soundRef.current.play();
          } else {
            soundRef.current.pause();
          }
        } catch {}
      }
    };
    handleMusicWithTimer();
  }, [isRunning, isMusicOn]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getTotalDuration = useCallback(
    () => (mode === "focus" ? focusDuration : breakDuration) * 60,
    [mode, focusDuration, breakDuration]
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getProgress = useCallback(
    () => timeLeft / getTotalDuration(),
    [timeLeft, getTotalDuration]
  );

  // ── Session logging ─────────────────────────────────────────────────────────

  const logCompletedSession = useCallback(
    async (durationMinutes: number) => {
      const sessionId = `session_${Date.now()}`;
      const session: FocusSession = {
        id: sessionId,
        taskId: linkedTaskId,
        taskTitle: linkedTaskTitle,
        startedAt: sessionStartRef.current.toISOString(),
        durationMinutes,
        mode: "focus",
      };

      if (userId) {
        await writeSession(userId, session);
      }

      if (linkedTaskId) {
        logFocusSession(linkedTaskId, durationMinutes, sessionId);
      }
    },
    [linkedTaskId, linkedTaskTitle, userId, logFocusSession]
  );

  // ── Animations ──────────────────────────────────────────────────────────────

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

  // ── Timer countdown ─────────────────────────────────────────────────────────

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      Vibration.vibrate([0, 500, 200, 500]);
      setIsRunning(false);

      if (mode === "focus") {
        const focusMins = focusDuration;
        setCompletedFocusMinutes(focusMins);
        setSessionsCompleted((prev) => prev + 1);
        logCompletedSession(focusMins);

        // Schedule notification for focus completion
        if (linkedTaskId && linkedTaskTitle) {
          scheduleTaskNotification(
            {
              id: `focus-complete-${Date.now()}`,
              title: `Focus session complete! 🎯`,
              dueDate: new Date().toISOString(),
              reminder: '0',
            },
            { sound: 'default', vibration: 'default', priority: 'high' }
          ).catch((error) => {
            console.error('Failed to schedule focus completion notification:', error);
          });
        }

        // Show subtask prompt if there's a linked task with subtasks
        if (linkedTask && linkedTask.subtasks && linkedTask.subtasks.length > 0) {
          setPendingSubtaskToggles({});
          setShowSubtaskPrompt(true);
        } else {
          // No task → go straight to break activity
          setShowBreakActivity(true);
        }
      } else {
        // Break ended → back to focus, don't auto-start
        setMode("focus");
        setTimeLeft(focusDuration * 60);
        sessionStartRef.current = new Date();
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, focusDuration, breakDuration]);

  // ── Subtask prompt handlers ─────────────────────────────────────────────────

  const handleSubtaskToggleInPrompt = (subtaskId: string) => {
    // Immediately toggle in context so it reflects live
    if (linkedTaskId) {
      toggleSubtaskDone(linkedTaskId, subtaskId);
    }
  };

  const handleSubtaskPromptProceed = () => {
    setShowSubtaskPrompt(false);
    // After prompt is closed, show break activity
    setShowBreakActivity(true);
  };

  // Called when BreakActivityModal is closed (or "Done" tapped)
  const handleBreakActivityClose = () => {
    setShowBreakActivity(false);
    // Transition into break timer
    setMode("break");
    setTimeLeft(breakDuration * 60);
    setIsRunning(true);
    sessionStartRef.current = new Date();
  };

  // ── Controls ────────────────────────────────────────────────────────────────

  const handleStartPause = () => setIsRunning((prev) => !prev);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getTotalDuration());
    sessionStartRef.current = new Date();
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === "focus") {
      // Log partial session
      const elapsed = Math.round(
        (focusDuration * 60 - timeLeft) / 60
      );
      if (elapsed > 0) logCompletedSession(elapsed);

      if (linkedTask?.subtasks?.length) {
        setCompletedFocusMinutes(elapsed);
        setPendingSubtaskToggles({});
        setShowSubtaskPrompt(true);
      } else {
        setShowBreakActivity(true);
        setCompletedFocusMinutes(elapsed);
      }
    } else {
      setMode("focus");
      setTimeLeft(focusDuration * 60);
      sessionStartRef.current = new Date();
    }
  };

  const handleStop = async () => {
    setIsRunning(false);
    if (soundRef.current) {
      try {
        soundRef.current.pause();
        await soundRef.current.seekTo(0);
        soundRef.current.remove();
        soundRef.current = null;
      } catch {}
    }
    router.back();
  };

  const loadingScale = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const styles = createStyles(theme, mode);

  // Header task label
  const headerLabel =
    linkedTaskTitle && linkedTaskTitle.length > 0
      ? linkedTaskTitle
      : mode === "focus"
      ? "Focus Mode"
      : "Break Time";

  return (
    <TouchableWithoutFeedback onPress={resetScreenSaverTimeout}>
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={showScreenSaver} />

        {/* ── Screen Saver ─────────────────────────────────────────── */}
        <Modal visible={showScreenSaver} transparent animationType="none">
          <TouchableWithoutFeedback onPress={resetScreenSaverTimeout}>
            <Animated.View
              style={[styles.screenSaverContainer, { opacity: screenSaverAnim }]}
            >
              <View style={styles.screenSaverContent}>
                <Text style={styles.screenSaverTime}>{formatTime(timeLeft)}</Text>
                <View style={styles.screenSaverProgressContainer}>
                  <View style={styles.screenSaverProgressBackground}>
                    <View
                      style={[
                        styles.screenSaverProgressFill,
                        {
                          width: `${(1 - getProgress()) * 100}%` as any,
                          backgroundColor:
                            mode === "focus"
                              ? theme.colors.primary
                              : theme.colors.secondary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.screenSaverProgressText}>
                    {Math.round((1 - getProgress()) * 100)}% complete
                  </Text>
                </View>
                <Text style={styles.screenSaverHint}>Tap anywhere to exit</Text>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* ── Subtask Completion Prompt ────────────────────────────── */}
        {linkedTask && (
          <SubtaskCompletionPrompt
            visible={showSubtaskPrompt}
            subtasks={linkedTask.subtasks ?? []}
            taskTitle={linkedTask.title}
            onToggle={handleSubtaskToggleInPrompt}
            onProceed={handleSubtaskPromptProceed}
            theme={theme}
          />
        )}

        {/* ── Break Activity Modal ─────────────────────────────────── */}
        <BreakActivityModal
          visible={showBreakActivity}
          onClose={handleBreakActivityClose}
          sessionDurationMinutes={completedFocusMinutes}
        />

        {/* ── Music Picker Modal ───────────────────────────────────── */}
        <Modal visible={showMusicPicker} transparent animationType="slide">
          <View style={styles.musicPickerOverlay}>
            <View style={styles.musicPickerContainer}>
              <View style={styles.musicPickerHeader}>
                <Text style={styles.musicPickerTitle}>Choose Music</Text>
                <TouchableOpacity
                  onPress={() => setShowMusicPicker(false)}
                  style={styles.musicPickerClose}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.onSurface}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.musicPickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {MUSIC_STREAMS.map((stream) => (
                  <TouchableOpacity
                    key={stream.id}
                    style={[
                      styles.musicPickerItem,
                      selectedStream.id === stream.id &&
                        isMusicOn &&
                        styles.musicPickerItemActive,
                    ]}
                    onPress={() => playMusicStream(stream)}
                  >
                    <View
                      style={[
                        styles.musicPickerIcon,
                        selectedStream.id === stream.id &&
                          isMusicOn &&
                          styles.musicPickerIconActive,
                      ]}
                    >
                      <Ionicons
                        name={stream.icon}
                        size={24}
                        color={
                          selectedStream.id === stream.id && isMusicOn
                            ? "#fff"
                            : theme.colors.primary
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.musicPickerItemText,
                        selectedStream.id === stream.id &&
                          isMusicOn &&
                          styles.musicPickerItemTextActive,
                      ]}
                    >
                      {stream.name}
                    </Text>
                    {selectedStream.id === stream.id && isMusicOn && (
                      <Ionicons
                        name="volume-high"
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.musicPickerHint}>
                🎵 Tap a stream to play. Music continues in background.
              </Text>
            </View>
          </View>
        </Modal>

        {/* ── Main UI ──────────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleStop} style={styles.backButton}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.onBackground}
              />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>
                {mode === "focus" ? "Focus Mode" : "Break Time"}
              </Text>
              {linkedTaskTitle && linkedTaskTitle.length > 0 && (
                <Text style={styles.headerTaskLabel} numberOfLines={1}>
                  {linkedTaskTitle}
                </Text>
              )}
            </View>
            <View style={styles.sessionBadge}>
              <Ionicons name="flame" size={16} color={theme.colors.primary} />
              <Text style={styles.sessionText}>{sessionsCompleted}</Text>
            </View>
          </View>

          {/* Mode Indicator */}
          <View style={styles.modeIndicator}>
            <View
              style={[
                styles.modeIcon,
                mode === "focus" && styles.modeIconActive,
              ]}
            >
              <Ionicons
                name="bulb"
                size={20}
                color={
                  mode === "focus" ? "#fff" : theme.colors.onSurfaceVariant
                }
              />
            </View>
            <View style={styles.modeLine} />
            <View
              style={[
                styles.modeIcon,
                mode === "break" && styles.modeIconActive,
              ]}
            >
              <Ionicons
                name="cafe"
                size={20}
                color={
                  mode === "break" ? "#fff" : theme.colors.onSurfaceVariant
                }
              />
            </View>
          </View>

          {/* Timer Circle */}
          <View style={styles.timerContainer}>
            <Animated.View
              style={[
                styles.timerCircle,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <CustomAnimatedCircularProgress
                size={CIRCLE_SIZE}
                width={8}
                fill={getProgress() * 100}
                tintColor={
                  mode === "focus"
                    ? theme.colors.primary
                    : theme.colors.secondary
                }
                backgroundColor={theme.colors.background}
                duration={isRunning ? 1000 : 300}
              >
                <View style={styles.timerContent}>
                  <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                  <Text style={styles.timerLabel}>
                    {mode === "focus" ? "Stay focused!" : "Take a break"}
                  </Text>
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusDot,
                        isRunning && styles.statusDotActive,
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {isRunning ? "Running" : "Paused"}
                    </Text>
                  </View>
                </View>
              </CustomAnimatedCircularProgress>
            </Animated.View>
          </View>

          {/* Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
              <Ionicons name="refresh" size={24} color={theme.colors.onSurface} />
              <Text style={styles.buttonLabel}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartPause}
            >
              <Ionicons
                name={isRunning ? "pause" : "play"}
                size={32}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSkip}
            >
              <Ionicons
                name="play-skip-forward"
                size={24}
                color={theme.colors.onSurface}
              />
              <Text style={styles.buttonLabel}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Music Controls */}
          <View style={styles.musicControlsContainer}>
            <TouchableOpacity
              style={[
                styles.musicToggleButton,
                isMusicOn && styles.musicToggleButtonActive,
              ]}
              onPress={async () => {
                if (isMusicOn) {
                  await stopMusic();
                } else if (selectedStream) {
                  await playMusicStream(selectedStream);
                } else {
                  setShowMusicPicker(true);
                }
              }}
              disabled={isMusicLoading}
            >
              {isMusicLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons
                  name={isMusicOn ? "volume-high" : "volume-mute"}
                  size={24}
                  color={isMusicOn ? theme.colors.primary : theme.colors.onSurface}
                />
              )}
              <Text
                style={[
                  styles.musicButtonLabel,
                  isMusicOn && { color: theme.colors.primary },
                ]}
              >
                {isMusicLoading
                  ? "Loading..."
                  : isMusicOn
                  ? "Music On"
                  : "Music Off"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.musicGenreButton}
              onPress={() => setShowMusicPicker(true)}
            >
              <Ionicons
                name={selectedStream.icon}
                size={24}
                color={theme.colors.onSurface}
              />
              <Text style={styles.musicButtonLabel}>{selectedStream.name}</Text>
            </TouchableOpacity>
          </View>

          {/* Stop Button */}
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Ionicons
              name="stop-circle-outline"
              size={20}
              color={theme.colors.error || "#ef4444"}
            />
            <Text style={styles.stopButtonText}>End Session</Text>
          </TouchableOpacity>
        </ScrollView>

        <Nav />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (theme: any, mode: TimerMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 30,
      paddingBottom: 16,
      position: "relative",
    },
    backButton: {
      position: "absolute",
      left: 20,
      zIndex: 1,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      elevation: 3,
    },
    headerCenter: {
      alignItems: "center",
      flex: 1,
      marginHorizontal: 56, // leave space for back + badge buttons
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.onBackground,
      textAlign: "center",
    },
    headerTaskLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      textAlign: "center",
    },
    sessionBadge: {
      position: "absolute",
      right: 20,
      zIndex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 4,
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      elevation: 3,
    },
    sessionText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    modeIndicator: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      gap: 8,
    },
    modeIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    modeIconActive: {
      backgroundColor:
        mode === "focus" ? theme.colors.primary : theme.colors.secondary,
    },
    modeLine: {
      width: 40,
      height: 2,
      backgroundColor: theme.colors.surface,
    },
    timerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 320,
      marginVertical: 40,
    },
    timerCircle: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      boxShadow: `0px 4px 20px ${mode === "focus" ? theme.colors.primary : theme.colors.secondary}4D`,
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
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
      gap: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.onSurfaceVariant,
    },
    statusDotActive: {
      backgroundColor: "#22c55e",
    },
    statusText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: "500",
    },
    controlsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 24,
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    primaryButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor:
        mode === "focus" ? theme.colors.primary : theme.colors.secondary,
      justifyContent: "center",
      alignItems: "center",
      boxShadow: `0px 4px 8px ${mode === "focus" ? theme.colors.primary : theme.colors.secondary}4D`,
      elevation: 6,
    },
    secondaryButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      elevation: 3,
    },
    buttonLabel: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    musicControlsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 24,
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    musicToggleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: theme.colors.surface,
      borderRadius: 25,
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      elevation: 3,
    },
    musicToggleButtonActive: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    musicGenreButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: theme.colors.surface,
      borderRadius: 25,
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      elevation: 3,
    },
    musicButtonLabel: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    stopButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 24,
      marginBottom: 100,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignSelf: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: theme.colors.error || "#ef4444",
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      elevation: 3,
    },
    stopButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.error || "#ef4444",
    },
    // Music picker
    musicPickerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    musicPickerContainer: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    musicPickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    musicPickerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.onSurface,
    },
    musicPickerClose: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.background,
      justifyContent: "center",
      alignItems: "center",
    },
    musicPickerScroll: {
      maxHeight: SCREEN_HEIGHT * 0.5,
    },
    musicPickerItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      gap: 16,
      marginBottom: 8,
    },
    musicPickerItemActive: {
      backgroundColor: theme.colors.primary + "20",
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    musicPickerIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
    },
    musicPickerIconActive: {
      backgroundColor: theme.colors.primary,
    },
    musicPickerItemText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    musicPickerItemTextActive: {
      color: theme.colors.primary,
    },
    musicPickerHint: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: 20,
    },
    // Screen saver
    screenSaverContainer: {
      flex: 1,
      backgroundColor: "#000",
      justifyContent: "center",
      alignItems: "center",
    },
    screenSaverContent: {
      alignItems: "center",
    },
    screenSaverTime: {
      fontSize: 96,
      fontWeight: "bold",
      color: "#fff",
      fontVariant: ["tabular-nums"],
      textShadowColor:
        mode === "focus" ? theme.colors.primary : theme.colors.secondary,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 30,
    },
    screenSaverProgressContainer: {
      alignItems: "center",
      marginTop: 32,
      width: SCREEN_WIDTH * 0.7,
    },
    screenSaverProgressBackground: {
      width: "100%",
      height: 6,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 3,
      overflow: "hidden",
    },
    screenSaverProgressFill: {
      height: "100%",
      borderRadius: 3,
    },
    screenSaverProgressText: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.6)",
      marginTop: 12,
      fontWeight: "500",
    },
    screenSaverHint: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.4)",
      marginTop: 24,
    },
  });
