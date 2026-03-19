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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { API_BASE } from "../../constants/api";
import Nav from "../../components/Nav";
import InputDialog from "../../components/InputDialog";
import { TextInput } from "react-native-paper";
import SparkleLoader from "../../components/SparkleLoader";

// ── Speech recognition — guarded for Expo Go compatibility ───────────────────
// expo-speech-recognition requires a custom dev build (native module).
// In Expo Go it is unavailable, so we lazy-load it and fall back to no-ops.
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: (event: string, cb: (e: any) => void) => void = () => {};

try {
  const mod = require("expo-speech-recognition");
  ExpoSpeechRecognitionModule  = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent    = mod.useSpeechRecognitionEvent;
} catch {
  // Running in Expo Go — speech recognition is disabled
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubTask {
  id:          string;
  text:        string;
  isAdding:    boolean;
  isGenarated: boolean;
  isDone:      boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLACEHOLDER_MAIN =
  "What needs to be done? Try 'Buy Milk at Whole Foods Tomorrow at 5pm.'";

const BASE_WIDTH = 390; // matches Nav.tsx

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
  const scale         = Math.min(width / BASE_WIDTH, 1.35);
  const NAV_HEIGHT    = Math.round(64 * scale);
  const safeBottom    = Platform.OS === "ios" ? insets.bottom : Math.max(insets.bottom, 8);
  const bottomPadding = NAV_HEIGHT + safeBottom + 72;

  // ── Core form state
  const [mainTask, setMainTask] = useState("");
  const [when,     setWhen]     = useState("");
  const [location, setLocation] = useState("");
  const [reminder, setReminder] = useState("");
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);

  // ── AI state
  const [aiMeta, setAiMeta] = useState(DEFAULT_AI_META);

  // ── UI state
  const [aiLoading,        setAiLoading]        = useState(false);
  const [aiError,          setAiError]          = useState<string | null>(null);
  const [dialogBoxVisible, setDialogBoxVisible] = useState(false);
  const [isRecording,      setIsRecording]      = useState(false);

  // ── Field editing state
  const [editingField, setEditingField] = useState<"when" | "location" | "reminder" | null>(null);

  // Preset reminder options
  const REMINDER_OPTIONS = [
    { label: "At time of task", value: "0" },
    { label: "5 minutes before", value: "5" },
    { label: "15 minutes before", value: "15" },
    { label: "30 minutes before", value: "30" },
    { label: "1 hour before", value: "60" },
    { label: "1 day before", value: "1440" },
  ];

  const [showReminderPicker, setShowReminderPicker] = useState(false);

  // DateTimePicker state (for iOS native picker)
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  // Preset date/time options for "When" field (for Android/web)
  const DATE_OPTIONS = [
    { label: "Today", getDate: () => { const d = new Date(); d.setHours(9, 0, 0, 0); return d; } },
    { label: "Today at 12pm", getDate: () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; } },
    { label: "Today at 5pm", getDate: () => { const d = new Date(); d.setHours(17, 0, 0, 0); return d; } },
    { label: "Tomorrow", getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
    { label: "Tomorrow at 9am", getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
    { label: "Tomorrow at 5pm", getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(17, 0, 0, 0); return d; } },
    { label: "This weekend", getDate: () => { const d = new Date(); const day = d.getDay(); const saturday = d.getDate() + (6 - day); d.setDate(saturday); d.setHours(10, 0, 0, 0); return d; } },
    { label: "Next week", getDate: () => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(9, 0, 0, 0); return d; } },
  ];

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Helper to format date/time for display
  const formatDateTime = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const dateStr = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    return `${dateStr} at ${timeStr}`;
  };

  // Get display text for reminder
  const getReminderDisplayText = (reminderValue: string): string => {
    if (!reminderValue) return "Set reminder";
    const option = REMINDER_OPTIONS.find(o => o.value === reminderValue);
    return option ? option.label : "Set reminder";
  };

  // Handle date input (for When field)
  const handleWhenDateChange = (event: any, selectedDate?: Date) => {
    // This is kept for future native picker support
    setEditingField(null);
  };

  // Handle field save from dialog (for when and location)
  const handleFieldSave = (value: string) => {
    const trimmed = value.trim();
    if (editingField === "when") {
      setWhen(trimmed);
    } else if (editingField === "location") {
      setLocation(trimmed);
    }
    setEditingField(null);
    setDialogBoxVisible(false);
  };

  const handleReminderSelect = (value: string) => {
    setReminder(value);
    setShowReminderPicker(false);
    setEditingField(null);
  };

  // Handle date selection from preset options
  const handleDateSelect = (getDate: () => Date) => {
    const date = getDate();
    setWhen(formatDateTime(date));
    setShowDatePicker(false);
    setEditingField(null);
  };

  // Handle native DateTimePicker change (iOS)
  const handleNativeDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setWhen(formatDateTime(selectedDate));
    }
    setShowNativePicker(false);
    setEditingField(null);
  };

  // ── Handle field editing
  const openFieldEditor = (field: "when" | "location" | "reminder") => {
    if (field === "when") {
      setEditingField(field);
      // Use native DateTimePicker on iOS, preset options on Android
      if (Platform.OS === "ios") {
        setTempDate(new Date());
        setShowNativePicker(true);
      } else {
        setShowDatePicker(true);
      }
    } else if (field === "reminder") {
      setEditingField(field);
      setShowReminderPicker(true);
    } else {
      setEditingField(field);
      setDialogBoxVisible(true);
    }
  };

  // ── Speech recognition is only available in custom dev builds, not Expo Go
  const speechAvailable = ExpoSpeechRecognitionModule !== null;

  // ── Navigation
  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
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
    const url = `${API_BASE}/api/ai/breakdown`;

    const startTime = Date.now();

    try {
      const res  = await fetch(`${API_BASE}/api/ai/breakdown`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ task: taskText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to break into steps");
      }

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

      if (typeof data?.when === "string" && data.when.trim()) {
        setWhen(data.when.trim());
      }

      setAiMeta({
        title:    typeof data?.title    === "string" && data.title.trim()    ? data.title.trim()    : null,
        category: typeof data?.category === "string" && data.category.trim() ? data.category.trim() : "Personal",
        emoji:    typeof data?.emoji    === "string" && data.emoji.trim()    ? data.emoji.trim()    : "📋",
        iconBg:   typeof data?.iconBg   === "string" && data.iconBg.trim()   ? data.iconBg.trim()   : "#E8E4FF",
      });

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      const isQuota = /quota|exceeded|rate.limit|limit:\s*0/i.test(msg);
      setAiError(
        isQuota
          ? "AI limit reached. Try again later or check your Gemini API quota."
          : msg
      );
    } finally {
      const elapsed   = Date.now() - startTime;
      const remaining = 700 - elapsed;
      if (remaining > 0) setTimeout(() => setAiLoading(false), remaining);
      else setAiLoading(false);
    }
  };

  // ── Save task ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const title = (aiMeta.title ?? mainTask).trim();
    if (!title) return;

    const today   = new Date();
    const dateKey = today.toISOString().slice(0, 10);

    addTask({
      title,
      category: aiMeta.category,
      icon:     aiMeta.emoji,
      iconBg:   aiMeta.iconBg,
      time:     when.trim() || "No time",
      dueDate:  when.trim() || undefined,
      location: location.trim() || undefined,
      reminder: reminder.trim() || undefined,
      status:   "todo",
      dateKey,
      subtasks: subTasks,
      isSynced: false,
    });

    setMainTask("");
    setWhen("");
    setLocation("");
    setReminder("");
    setSubTasks([]);
    setAiMeta(DEFAULT_AI_META);
    setAiError(null);

    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  // ── Speech recognition hooks (no-ops when not available) ─────────────────────
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
    if (!speechAvailable) return;
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
    if (!speechAvailable) return;
    ExpoSpeechRecognitionModule.stop();
    setIsRecording(false);
  };

  // ── Derived styles
  const inputBg  = theme.colors.surface       ?? "#FFFFFF";
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
        <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.surfaceVariant }]}>
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
          {/* Field input dialog (for when and location) */}
          <InputDialog
            visible={dialogBoxVisible && (editingField === "when" || editingField === "location")}
            hideDialog={() => {
              setDialogBoxVisible(false);
              setEditingField(null);
            }}
            title={editingField === "when" ? "Set date & time" : "Add location"}
            onSubmit={handleFieldSave}
            initialValue={editingField === "when" ? when : location}
            placeholder={editingField === "when" ? "e.g., Tomorrow at 5pm" : "e.g., Whole Foods"}
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
                if (aiMeta.title) setAiMeta(DEFAULT_AI_META);
                if (aiError)      setAiError(null);
              }}
              multiline
              textAlignVertical="top"
              mode="outlined"
              outlineStyle={{ borderRadius: 16 }}
            />

            {/* Mic button — hidden in Expo Go since speech is unavailable */}
            {speechAvailable && (
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
            )}
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

          {/* ── AI-generated title preview */}
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
              <Text style={[styles.detailValue, { color: when ? theme.colors.text : theme.colors.textMuted }]}>
                {when || "Set date & time"}
              </Text>
            </View>
            <TouchableOpacity 
              hitSlop={12} 
              activeOpacity={0.7}
              onPress={() => openFieldEditor("when")}
            >
              <Ionicons name="pencil" size={18} color={editTint} />
            </TouchableOpacity>
          </View>

          {/* ── Location */}
          <View style={[styles.detailRow, { backgroundColor: rowBg }]}>
            <Ionicons name="location-outline" size={22} color={theme.colors.primary} />
            <View style={styles.detailTextWrap}>
              <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Location</Text>
              <Text style={[styles.detailValue, { color: location ? theme.colors.text : theme.colors.textMuted }]}>
                {location || "Add location"}
              </Text>
            </View>
            <TouchableOpacity 
              hitSlop={12} 
              activeOpacity={0.7}
              onPress={() => openFieldEditor("location")}
            >
              <Ionicons name="pencil" size={18} color={editTint} />
            </TouchableOpacity>
          </View>

          {/* ── Reminder */}
          <View style={[styles.detailRow, { backgroundColor: rowBg }]}>
            <Ionicons name="notifications-outline" size={22} color="#E65100" />
            <View style={styles.detailTextWrap}>
              <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Reminder</Text>
              <Text style={[styles.detailValue, { color: reminder ? theme.colors.text : theme.colors.textMuted }]}>
                {getReminderDisplayText(reminder)}
              </Text>
            </View>
            <TouchableOpacity 
              hitSlop={12} 
              activeOpacity={0.7}
              onPress={() => openFieldEditor("reminder")}
            >
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
              <Text style={[styles.subTaskText, { color: theme.colors.text }]} numberOfLines={1}>
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
              { backgroundColor: theme.colors.primary, opacity: !mainTask.trim() ? 0.5 : 1 },
            ]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={!mainTask.trim()}
          >
            <Text style={styles.saveButtonText}>Save Task</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Reminder Picker Modal */}
        {showReminderPicker && (
          <View style={styles.reminderPickerOverlay}>
            <View style={[styles.reminderPicker, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.reminderPickerTitle, { color: theme.colors.text }]}>
                Set Reminder
              </Text>
              {REMINDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.reminderOption, { borderBottomColor: theme.colors.outline }]}
                  onPress={() => handleReminderSelect(option.value)}
                >
                  <Text style={[styles.reminderOptionText, { color: theme.colors.text }]}>
                    {option.label}
                  </Text>
                  {reminder === option.value && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.reminderCancelBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={() => {
                  setShowReminderPicker(false);
                  setEditingField(null);
                }}
              >
                <Text style={[styles.reminderCancelText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Date Picker Modal */}
        {showDatePicker && (
          <View style={styles.reminderPickerOverlay}>
            <View style={[styles.reminderPicker, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.reminderPickerTitle, { color: theme.colors.text }]}>
                Set Date & Time
              </Text>
              {DATE_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.reminderOption, { borderBottomColor: theme.colors.outline }]}
                  onPress={() => handleDateSelect(option.getDate)}
                >
                  <Text style={[styles.reminderOptionText, { color: theme.colors.text }]}>
                    {option.label}
                  </Text>
                  {when === formatDateTime(option.getDate()) && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.reminderCancelBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={() => {
                  setShowDatePicker(false);
                  setEditingField(null);
                }}
              >
                <Text style={[styles.reminderCancelText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Native DateTimePicker (iOS) */}
        {showNativePicker && Platform.OS === "ios" && (
          <View style={styles.reminderPickerOverlay}>
            <View style={[styles.reminderPicker, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.reminderPickerTitle, { color: theme.colors.text }]}>
                Set Date & Time
              </Text>
              <View style={{ alignItems: "center", paddingVertical: 10 }}>
                <DateTimePicker
                  value={tempDate}
                  mode="datetime"
                  display="spinner"
                  onChange={(event: any, date: Date | undefined) => {
                    if (date) setTempDate(date);
                  }}
                  style={{ width: "100%", height: 200 }}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 20 }}>
                <TouchableOpacity
                  style={[styles.reminderCancelBtn, { flex: 1, backgroundColor: theme.colors.surfaceVariant }]}
                  onPress={() => {
                    setShowNativePicker(false);
                    setEditingField(null);
                  }}
                >
                  <Text style={[styles.reminderCancelText, { color: theme.colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reminderCancelBtn, { flex: 1, backgroundColor: theme.colors.primary }]}
                  onPress={() => handleNativeDateChange(undefined, tempDate)}
                >
                  <Text style={[styles.reminderCancelText, { color: "#FFF" }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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

  aiError:  { fontSize: 14, marginBottom: 8 },
  aiButton: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "center",
    paddingVertical: 14,
    borderRadius:    14,
    gap:             10,
    marginBottom:    16,
  },
  aiButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },

  aiTitleRow: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderRadius:      14,
    marginBottom:      12,
    gap:               12,
  },
  aiTitleEmoji:     { fontSize: 24 },
  aiTitleLabel:     { fontSize: 12, fontWeight: "500", marginBottom: 2 },
  aiTitleValue:     { fontSize: 15, fontWeight: "700" },
  categoryBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  categoryBadgeText:{ fontSize: 12, fontWeight: "600" },

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
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "center",
    paddingVertical: 12,
    borderRadius:    14,
    borderWidth:     1.5,
    borderStyle:     "dashed",
    marginTop:        8,
    gap:              8,
  },
  addSubTaskText: { fontSize: 15, fontWeight: "600" },

  saveButton: {
    paddingVertical: 16,
    borderRadius:    14,
    alignItems:      "center",
    justifyContent:  "center",
    marginTop:        28,
  },
  saveButtonText: { color: "#FFF", fontSize: 17, fontWeight: "700" },

  // Reminder Picker Styles
  reminderPickerOverlay: {
    position:     "absolute",
    top:          0,
    left:         0,
    right:        0,
    bottom:       0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems:   "center",
    zIndex:       1000,
  },
  reminderPicker: {
    width:         "80%",
    maxWidth:      320,
    borderRadius:   16,
    paddingVertical: 16,
  },
  reminderPickerTitle: {
    fontSize:     18,
    fontWeight:    "700",
    textAlign:    "center",
    marginBottom:  16,
  },
  reminderOption: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  reminderOptionText: {
    fontSize: 16,
  },
  reminderCancelBtn: {
    marginTop:    12,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius:  12,
    alignItems:   "center",
  },
  reminderCancelText: {
    fontSize:   16,
    fontWeight: "600",
  },
});