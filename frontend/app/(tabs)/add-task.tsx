/**
 * Add Task screen — New Task form with main input, AI breakdown,
 * When/Location/Reminder rows, and sub-tasks.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { API_BASE } from "../../constants/api";
import Nav from "../../components/Nav";
import InputDialog from "../../components/InputDialog";
import { TextInput } from "react-native-paper";
import SparkleLoader from "../../components/SparkleLoader";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubTask {
  id: string;
  text: string;
  isAdding: boolean;
  isGenarated: boolean;
  isDone: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLACEHOLDER_MAIN =
  "What needs to be done? Try 'Buy Milk at Whole Foods Tomorrow at 5pm.'";

const BASE_WIDTH = 390; // matches Nav.tsx

// Default AI metadata used before any AI call and as fallback
const DEFAULT_AI_META = {
  title:    null as string | null,
  category: "Personal",
  emoji:    "📋",
  iconBg:   "#E8E4FF",
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AddTaskScreen() {
  const { theme }   = useAppTheme();
  const { addTask } = useTasks();
  const { width }   = useWindowDimensions();
  const insets      = useSafeAreaInsets();

  // Layout
  const scale        = Math.min(width / BASE_WIDTH, 1.35);
  const NAV_HEIGHT   = Math.round(64 * scale);
  const safeBottom   = Platform.OS === "ios" ? insets.bottom : Math.max(insets.bottom, 8);
  const bottomPadding = NAV_HEIGHT + safeBottom + 72;

  // ── Core form state
  const [mainTask, setMainTask] = useState("");
  const [when,     setWhen]     = useState("");
  const [location, setLocation] = useState("");
  const [reminder, setReminder] = useState("");
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);

  // ── AI state — populated after a successful breakdown call
  const [aiMeta, setAiMeta] = useState(DEFAULT_AI_META);

  // ── UI state
  const [aiLoading,       setAiLoading]       = useState(false);
  const [aiError,         setAiError]         = useState<string | null>(null);
  const [dialogBoxVisible,setDialogBoxVisible] = useState(false);
  const [isRecording,     setIsRecording]     = useState(false);

  // ── Navigation
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  // ── Sub-task helpers
  const toggleSubTask = (id: string) => {
    setSubTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isAdding: !t.isAdding } : t))
    );
  };

  const addSubTask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubTasks((prev) => [
      ...prev,
      { id: String(Date.now()), text: trimmed, isAdding: true, isGenarated: false, isDone: false },
    ]);
  };

  // ── AI breakdown ─────────────────────────────────────────────────────────────
  const handleBreakIntoSteps = async () => {
    const taskText = mainTask.trim();
    if (!taskText || aiLoading) return;

    setAiError(null);
    setAiLoading(true);
    const startTime = Date.now();

    try {
      const res  = await fetch(`${API_BASE}/api/ai/breakdown`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ task: taskText }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Backend returns a user-friendly message for 422 (spam/offensive),
        // 429 (quota), and 400/500 errors — show it directly.
        throw new Error(data?.error || "Failed to break into steps");
      }

      // ── steps → subtasks
      const steps: string[] = Array.isArray(data?.steps) ? data.steps : [];
      if (steps.length > 0) {
        setSubTasks(
          steps.map((text, i) => ({
            id:          String(Date.now() + i),
            text,
            isAdding:    true,
            isGenarated: true,
            isDone:      false,
          }))
        );
      }

      // ── when — trust the backend entirely (it pre-computes dates server-side)
      if (typeof data?.when === "string" && data.when.trim()) {
        setWhen(data.when.trim());
      }

      // ── title / category / emoji / iconBg — from AI response
      setAiMeta({
        title:    typeof data?.title    === "string" && data.title.trim()    ? data.title.trim()    : null,
        category: typeof data?.category === "string" && data.category.trim() ? data.category.trim() : "Personal",
        emoji:    typeof data?.emoji    === "string" && data.emoji.trim()    ? data.emoji.trim()    : "📋",
        iconBg:   typeof data?.iconBg   === "string" && data.iconBg.trim()   ? data.iconBg.trim()   : "#E8E4FF",
      });

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setAiError(msg);
    } finally {
      // Enforce minimum 700 ms so the loader doesn't flash too quickly
      const elapsed   = Date.now() - startTime;
      const remaining = 700 - elapsed;
      if (remaining > 0) {
        setTimeout(() => setAiLoading(false), remaining);
      } else {
        setAiLoading(false);
      }
    }
  };

  // ── Save task ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    // Use AI-generated title if available, otherwise fall back to raw input
    const title = (aiMeta.title ?? mainTask).trim();
    if (!title) return;

    const today   = new Date();
    const dateKey = today.toISOString().slice(0, 10); // YYYY-MM-DD

    addTask({
      title,
      category: aiMeta.category,
      icon:     aiMeta.emoji,
      iconBg:   aiMeta.iconBg,
      time:     when.trim() || "No time",
      status:   "todo",
      dateKey,
      subtasks: subTasks,
    });

    // Reset all state
    setMainTask("");
    setWhen("");
    setLocation("");
    setReminder("");
    setSubTasks([]);
    setAiMeta(DEFAULT_AI_META);
    setAiError(null);

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  // ── Speech recognition ───────────────────────────────────────────────────────
  useSpeechRecognitionEvent("result", (event) => {
    setMainTask(event.results[0]?.transcript ?? "");
  });

  useSpeechRecognitionEvent("error", () => {
    setIsRecording(false);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsRecording(false);
  });

  const startRecording = async () => {
    setMainTask("");
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      console.log("Microphone permission denied");
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang:           "en-US",
      interimResults: true,
      continuous:     true,
    });
    setIsRecording(true);
  };

  const stopRecording = () => {
    ExpoSpeechRecognitionModule.stop();
    setIsRecording(false);
  };

  // ── Derived styles
  const inputBg  = theme.colors.surface      ?? "#FFFFFF";
  const rowBg    = theme.colors.surfaceVariant ?? "#F5F5F5";
  const editTint = theme.colors.primary + "CC";

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      {/* Full-screen AI loading overlay */}
      {aiLoading && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <SparkleLoader />
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} hitSlop={12} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            New Task
          </Text>

          <View style={styles.bellWrap}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
            <View style={[styles.bellDot, { backgroundColor: theme.colors.primary }]} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Sub-task input dialog */}
          <InputDialog
            visible={dialogBoxVisible}
            hideDialog={() => setDialogBoxVisible(false)}
            title="Enter the sub task"
            onSubmit={addSubTask}
          />

          {/* ── Main task input */}
          <View style={{ position: "relative" }}>
            <TextInput
              style={[styles.mainInput, { backgroundColor: inputBg, color: theme.colors.text }]}
              placeholder={PLACEHOLDER_MAIN}
              placeholderTextColor={theme.colors.textMuted}
              value={mainTask}
              onChangeText={(text) => {
                setMainTask(text);
                // Clear stale AI metadata when user edits the task
                if (aiMeta.title) setAiMeta(DEFAULT_AI_META);
                if (aiError)      setAiError(null);
              }}
              multiline
              textAlignVertical="top"
              mode="outlined"
              outlineStyle={{ borderRadius: 16 }}
            />
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              style={styles.micButton}
            >
              <Ionicons
                name={isRecording ? "mic" : "mic-outline"}
                size={28}
                color={isRecording ? theme.colors.primary : theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* ── AI error message */}
          {aiError ? (
            <Text style={[styles.aiError, { color: theme.colors.error }]}>
              {aiError}
            </Text>
          ) : null}

          {/* ── AI breakdown button */}
          <TouchableOpacity
            style={[
              styles.aiButton,
              { backgroundColor: theme.colors.primary, opacity: aiLoading ? 0.7 : 1 },
            ]}
            onPress={handleBreakIntoSteps}
            activeOpacity={0.85}
            disabled={aiLoading || !mainTask.trim()}
          >
            {aiLoading ? (
              <Text style={styles.aiButtonText}>Breaking into steps…</Text>
            ) : (
              <>
                <MaterialCommunityIcons name="auto-fix" size={22} color="#FFF" />
                <Text style={styles.aiButtonText}>Break into steps with AI</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ── AI-generated title preview (shown after successful breakdown) */}
          {aiMeta.title ? (
            <View style={[styles.aiTitleRow, { backgroundColor: rowBg }]}>
              <Text style={styles.aiTitleEmoji}>{aiMeta.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiTitleLabel, { color: theme.colors.textMuted }]}>
                  Task title
                </Text>
                <Text style={[styles.aiTitleValue, { color: theme.colors.text }]}>
                  {aiMeta.title}
                </Text>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + "22" }]}>
                <Text style={[styles.categoryBadgeText, { color: theme.colors.primary }]}>
                  {aiMeta.category}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ── When */}
          <View style={[styles.detailRow, { backgroundColor: rowBg }]}>
            <Ionicons name="calendar-outline" size={22} color={theme.colors.primary} />
            <View style={styles.detailTextWrap}>
              <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>When</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: when ? theme.colors.text : theme.colors.textMuted },
                ]}
              >
                {when || "Set date & time"}
              </Text>
            </View>
            <TouchableOpacity hitSlop={12} activeOpacity={0.7}>
              <Ionicons name="pencil" size={18} color={editTint} />
            </TouchableOpacity>
          </View>

          {/* ── Location */}
          <View style={[styles.detailRow, { backgroundColor: rowBg }]}>
            <Ionicons name="location-outline" size={22} color={theme.colors.primary} />
            <View style={styles.detailTextWrap}>
              <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Location</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: location ? theme.colors.text : theme.colors.textMuted },
                ]}
              >
                {location || "Add location"}
              </Text>
            </View>
            <TouchableOpacity hitSlop={12} activeOpacity={0.7}>
              <Ionicons name="pencil" size={18} color={editTint} />
            </TouchableOpacity>
          </View>

          {/* ── Reminder */}
          <View style={[styles.detailRow, { backgroundColor: rowBg }]}>
            <Ionicons name="notifications-outline" size={22} color="#E65100" />
            <View style={styles.detailTextWrap}>
              <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Reminder</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: reminder ? theme.colors.text : theme.colors.textMuted },
                ]}
              >
                {reminder || "Set reminder"}
              </Text>
            </View>
            <TouchableOpacity hitSlop={12} activeOpacity={0.7}>
              <Ionicons name="pencil" size={18} color={editTint} />
            </TouchableOpacity>
          </View>

          {/* ── Sub-tasks */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Sub task
          </Text>

          {subTasks.map((st) => (
            <TouchableOpacity
              key={st.id}
              style={[styles.subTaskRow, { backgroundColor: rowBg }]}
              onPress={() => toggleSubTask(st.id)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor:     theme.colors.textMuted,
                    backgroundColor: st.isAdding ? theme.colors.primary : "transparent",
                  },
                ]}
              >
                {st.isAdding && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text
                style={[
                  styles.subTaskText,
                  { color: theme.colors.text },
                ]}
                numberOfLines={1}
              >
                {st.text}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.addSubTaskBtn, { borderColor: theme.colors.primary }]}
            onPress={() => setDialogBoxVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={theme.colors.primary} />
            <Text style={[styles.addSubTaskText, { color: theme.colors.primary }]}>
              Add sub-task
            </Text>
          </TouchableOpacity>

          {/* ── Save */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: !mainTask.trim() ? 0.5 : 1,
              },
            ]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={!mainTask.trim()}
          >
            <Text style={styles.saveButtonText}>Save Task</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Nav />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex:      { flex: 1 },

  loadingOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },

  header: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingHorizontal: 20,
    paddingVertical:   16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  bellWrap:    { position: "relative" },
  bellDot: {
    position:     "absolute",
    top: 0, right: 0,
    width:        8,
    height:       8,
    borderRadius: 4,
  },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, flexGrow: 1 },

  mainInput: {
    paddingHorizontal: 0,
    paddingVertical:   16,
    paddingBottom:     35,
    fontSize:          16,
    minHeight:         100,
    marginBottom:      16,
  },
  micButton: {
    position:       "absolute",
    right:          10,
    bottom:         25,
    justifyContent: "center",
    alignItems:     "center",
  },

  aiError:      { fontSize: 14, marginBottom: 8 },
  aiButton: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius:    14,
    gap:             10,
    marginBottom:    16,
  },
  aiButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },

  // AI title preview card shown after breakdown
  aiTitleRow: {
    flexDirection:  "row",
    alignItems:     "center",
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderRadius:      14,
    marginBottom:      12,
    gap:               12,
  },
  aiTitleEmoji: { fontSize: 24 },
  aiTitleLabel: { fontSize: 12, fontWeight: "500", marginBottom: 2 },
  aiTitleValue: { fontSize: 15, fontWeight: "700" },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:      20,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: "600" },

  detailRow: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderRadius:      14,
    marginBottom:      10,
    gap:               12,
  },
  detailTextWrap: { flex: 1 },
  detailLabel:    { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  detailValue:    { fontSize: 15, fontWeight: "600" },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 8, marginBottom: 12 },

  subTaskRow: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderRadius:      14,
    marginBottom:       8,
    gap:               12,
  },
  checkbox: {
    width:          22,
    height:         22,
    borderRadius:    6,
    borderWidth:     2,
    alignItems:     "center",
    justifyContent: "center",
  },
  subTaskText: { flex: 1, fontSize: 15, fontWeight: "500" },

  addSubTaskBtn: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius:    14,
    borderWidth:     1.5,
    borderStyle:    "dashed",
    marginTop:       8,
    gap:             8,
  },
  addSubTaskText: { fontSize: 15, fontWeight: "600" },

  saveButton: {
    paddingVertical: 16,
    borderRadius:    14,
    alignItems:     "center",
    justifyContent: "center",
    marginTop:       28,
  },
  saveButtonText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
});