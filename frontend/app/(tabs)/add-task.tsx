/**
 * Add Task screen — New Task form with main input, AI breakdown,
 * When/Location/Reminder rows, and sub-tasks.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
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

interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

const PLACEHOLDER_MAIN =
  "What needs to be done? Try 'Buy Milk at Whole Foods Tomorrow at 5pm.'";

// Match Nav.tsx so scroll padding clears the bottom bar
const BASE_WIDTH = 390;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format a date as "DD Mon YYYY" */
function formatDateKey(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Extract time/date from task text and return "DD Mon YYYY, h.mm am/pm" */
function extractTimeFromText(text: string): string | null {
  const lower = text.trim().toLowerCase();
  const today = new Date();

  // Relative day with no specific time: "tomorrow", "create a song tomorrow", "next monday"
  if (/\btomorrow\b/.test(lower) && !/\d{1,2}\s*(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)/i.test(lower)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${formatDateKey(tomorrow)}, 5.00 pm`;
  }
  if (/\btoday\b/.test(lower) && !/\d{1,2}\s*(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)/i.test(lower)) {
    return `${formatDateKey(today)}, 5.00 pm`;
  }

  // Match time: at 6pm, 6.pm, 8.pm, at 6:30 pm, by 3pm (allow dot or space before am/pm)
  const match = lower.match(
    /(?:at|by|before|@)?\s*(\d{1,2})(?::(\d{2}))?[.\s]*(am|pm|a\.m\.|p\.m\.)?/i
  );
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const min = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = (match[3] || "").replace(/\./g, "").toLowerCase();
  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;
  if (!ampm && hour >= 1 && hour <= 7) hour += 12; // assume pm for 1-7 without am/pm
  const dateStr = formatDateKey(today);
  const hour12 = hour % 12 || 12;
  const amPm = hour < 12 ? "am" : "pm";
  const minStr = min > 0 ? `.${min.toString().padStart(2, "0")}` : ".00";
  return `${dateStr}, ${hour12}${minStr} ${amPm}`;
}

export default function AddTaskScreen() {
  const { theme } = useAppTheme();
  const { addTask } = useTasks();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const scale = Math.min(width / BASE_WIDTH, 1.35);
  const NAV_HEIGHT = Math.round(64 * scale);
  const safeBottom =
    Platform.OS === "ios"
      ? insets.bottom
      : Math.max(insets.bottom, 8);
  // Extra space so Save button stays above the nav bar when scrolled to end
  const bottomPadding = NAV_HEIGHT + safeBottom + 72;

  const [mainTask, setMainTask] = useState("");
  const [when, setWhen] = useState("");
  const [location, setLocation] = useState("");
  const [reminder, setReminder] = useState("");
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleBack = () => router.back();

  const toggleSubTask = (id: string) => {
    setSubTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const addSubTask = () => {
    setSubTasks((prev) => [
      ...prev,
      { id: String(Date.now()), text: "New sub-task", done: false },
    ]);
  };

  const handleBreakIntoSteps = async () => {
    const taskText = mainTask.trim();
    if (!taskText || aiLoading) return;
    setAiError(null);
    setAiLoading(true);
    const url = `${API_BASE}/api/ai/breakdown`;
    // #region agent log
    fetch(`${API_BASE}/api/debug-log`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'add-task.tsx:handleBreakIntoSteps',message:'AI breakdown request',data:{apiBase:API_BASE,url},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskText }),
      });
      const data = await res.json();
      // #region agent log
      fetch(`${API_BASE}/api/debug-log`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'add-task.tsx:handleBreakIntoSteps',message:'AI breakdown response',data:{ok:res.ok,status:res.status},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (!res.ok) {
        throw new Error(data?.error || "Failed to break into steps");
      }
      const steps: string[] = Array.isArray(data?.steps) ? data.steps : [];
      if (steps.length > 0) {
        setSubTasks(
          steps.map((text, i) => ({
            id: String(Date.now() + i),
            text,
            done: false,
          }))
        );
      }
      const whenFromApi = typeof data?.when === "string" && data.when.trim() ? data.when.trim() : null;
      const whenFromText = whenFromApi ?? extractTimeFromText(taskText);
      if (whenFromText) {
        setWhen(whenFromText);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      // #region agent log
      fetch(`${API_BASE}/api/debug-log`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'add-task.tsx:handleBreakIntoSteps',message:'AI breakdown error',data:{message:msg},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const isQuota = /quota|exceeded|rate.limit|limit:\s*0/i.test(msg);
      setAiError(
        isQuota
          ? "AI limit reached. Try again later or check your Gemini API quota."
          : msg
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    const title = mainTask.trim();
    if (!title) return;
    const today = new Date();
    const dateKey = today.toISOString().slice(0, 10); // YYYY-MM-DD
    addTask({
      category: location.trim() || "Personal",
      title,
      time: when.trim() || "No time",
      status: "todo",
      icon: "📋",
      iconBg: "#E8E4FF",
      dateKey,
    });
    router.back();
  };

  const inputBg = theme.colors.surfaceVariant || "#F0F0F0";
  const rowBg = theme.colors.surfaceVariant || "#F5F5F5";
  const editTint = theme.colors.primary + "CC";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} hitSlop={12} activeOpacity={0.7}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            New Task
          </Text>
          <View style={styles.bellWrap}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={theme.colors.text}
            />
            <View style={[styles.bellDot, { backgroundColor: theme.colors.primary }]} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main task input */}
          <TextInput
            style={[
              styles.mainInput,
              {
                backgroundColor: inputBg,
                color: theme.colors.text,
              },
            ]}
            placeholder={PLACEHOLDER_MAIN}
            placeholderTextColor={theme.colors.textMuted}
            value={mainTask}
            onChangeText={setMainTask}
            multiline
            textAlignVertical="top"
          />

          {/* Break into steps with AI */}
          {aiError ? (
            <Text style={[styles.aiError, { color: theme.colors.error }]}>
              {aiError}
            </Text>
          ) : null}
          <TouchableOpacity
            style={[
              styles.aiButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: aiLoading ? 0.7 : 1,
              },
            ]}
            onPress={handleBreakIntoSteps}
            activeOpacity={0.85}
            disabled={aiLoading || !mainTask.trim()}
          >
            {aiLoading ? (
              <Text style={styles.aiButtonText}>Breaking into steps…</Text>
            ) : (
              <>
                <MaterialCommunityIcons
                  name="auto-fix"
                  size={22}
                  color="#FFF"
                />
                <Text style={styles.aiButtonText}>Break into steps with AI</Text>
              </>
            )}
          </TouchableOpacity>

          {/* When / Location / Reminder */}
          <View style={[styles.detailRow, { backgroundColor: rowBg }]}>
            <Ionicons
              name="calendar-outline"
              size={22}
              color={theme.colors.primary}
            />
            <View style={styles.detailTextWrap}>
              <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>
                When
              </Text>
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

          <View style={[styles.detailRow, { backgroundColor: rowBg }]}>
            <Ionicons
              name="location-outline"
              size={22}
              color={theme.colors.primary}
            />
            <View style={styles.detailTextWrap}>
              <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>
                Location
              </Text>
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

          <View style={[styles.detailRow, { backgroundColor: rowBg }]}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color="#E65100"
            />
            <View style={styles.detailTextWrap}>
              <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>
                Reminder
              </Text>
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

          {/* Sub-tasks */}
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
                    borderColor: theme.colors.textMuted,
                    backgroundColor: st.done ? theme.colors.primary : "transparent",
                  },
                ]}
              >
                {st.done && (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                )}
              </View>
              <Text
                style={[
                  styles.subTaskText,
                  {
                    color: theme.colors.text,
                    textDecorationLine: st.done ? "line-through" : "none",
                  },
                ]}
                numberOfLines={1}
              >
                {st.text}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.addSubTaskBtn, { borderColor: theme.colors.primary }]}
            onPress={addSubTask}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={theme.colors.primary} />
            <Text style={[styles.addSubTaskText, { color: theme.colors.primary }]}>
              Add sub-task
            </Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Nav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  bellWrap: {
    position: "relative",
  },
  bellDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexGrow: 1,
  },
  mainInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
  },
  aiError: {
    fontSize: 14,
    marginBottom: 8,
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
    marginBottom: 20,
  },
  aiButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 12,
  },
  subTaskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  subTaskText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  addSubTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 8,
    gap: 8,
  },
  addSubTaskText: {
    fontSize: 15,
    fontWeight: "600",
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
