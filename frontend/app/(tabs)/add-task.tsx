/**
 * Add Task screen — full version with:
 *  • Custom inline calendar + time picker (no external dependency)
 *  • Duration estimates per subtask
 *  • Smart reminder filtering based on AI task duration
 *  • AI breakdown with neutralisation + system prompt
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Modal,
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

// ── Speech recognition — guarded for Expo Go ─────────────────────────────────
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: (event: string, cb: (e: any) => void) => void = () => {};
try {
  const mod = require("expo-speech-recognition");
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent   = mod.useSpeechRecognitionEvent;
} catch { /* Expo Go — speech disabled */ }

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubTask {
  id:               string;
  text:             string;
  isAdding:         boolean;
  isGenarated:      boolean;
  isDone:           boolean;
  durationMinutes?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLACEHOLDER_MAIN =
  "What needs to be done? Try 'Buy Milk at Whole Foods Tomorrow at 5pm.'";

const BASE_WIDTH = 390;

const DEFAULT_AI_META = {
  title:                null as string | null,
  category:             "Personal",
  emoji:                "📋",
  iconBg:               "#E8E4FF",
  totalDurationMinutes: 0,
};

const WEEKDAYS  = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS    = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const ALL_REMINDER_OPTIONS = [
  { label: "At time of task",    value: "0"    },
  { label: "5 minutes before",   value: "5"    },
  { label: "15 minutes before",  value: "15"   },
  { label: "30 minutes before",  value: "30"   },
  { label: "1 hour before",      value: "60"   },
  { label: "2 hours before",     value: "120"  },
  { label: "1 day before",       value: "1440" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatDisplayDate(date: Date): string {
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);

  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (d.getTime() === today.getTime())    return `Today at ${timeStr}`;
  if (d.getTime() === tomorrow.getTime()) return `Tomorrow at ${timeStr}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + ` at ${timeStr}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ─── Custom Calendar + Time Picker ───────────────────────────────────────────

interface DateTimePickerModalProps {
  visible:    boolean;
  initial:    Date | null;
  onConfirm:  (date: Date) => void;
  onCancel:   () => void;
  primaryColor: string;
  theme:      any;
}

function DateTimePickerModal({
  visible, initial, onConfirm, onCancel, primaryColor, theme,
}: DateTimePickerModalProps) {
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(initial?.getFullYear()  ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial?.getMonth()     ?? now.getMonth());
  const [selDate,   setSelDate]   = useState(initial?.getDate()       ?? now.getDate());
  const [selYear,   setSelYear]   = useState(initial?.getFullYear()  ?? now.getFullYear());
  const [selMonth,  setSelMonth]  = useState(initial?.getMonth()     ?? now.getMonth());
  const [selHour,   setSelHour]   = useState(initial?.getHours()     ?? 9);
  const [selMin,    setSelMin]    = useState(
    initial ? Math.floor(initial.getMinutes() / 15) * 15 : 0
  );
  const [ampm,      setAmpm]      = useState<"AM"|"PM">(
    (initial?.getHours() ?? 9) >= 12 ? "PM" : "AM"
  );
  const [tab, setTab] = useState<"date"|"time">("date");

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDay     = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells   = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const isToday = (d: number) =>
    d === todayD && viewMonth === todayM && viewYear === todayY;

  const isSelected = (d: number) =>
    d === selDate && viewMonth === selMonth && viewYear === selYear;

  const selectDay = (d: number) => {
    if (d < 1 || d > daysInMonth) return;
    setSelDate(d);
    setSelMonth(viewMonth);
    setSelYear(viewYear);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
    else setViewMonth(m => m + 1);
  };

  // Hour in 12h display
  const display12Hour = selHour === 0 ? 12 : selHour > 12 ? selHour - 12 : selHour;

  const adjustHour = (delta: number) => {
    let h = display12Hour + delta;
    if (h < 1)  h = 12;
    if (h > 12) h = 1;
    const hour24 = ampm === "AM"
      ? (h === 12 ? 0 : h)
      : (h === 12 ? 12 : h + 12);
    setSelHour(hour24);
  };

  const adjustMin = (delta: number) => {
    let m = selMin + delta * 15;
    if (m < 0)  m = 45;
    if (m >= 60) m = 0;
    setSelMin(m);
  };

  const toggleAmpm = () => {
    const newAmpm = ampm === "AM" ? "PM" : "AM";
    setAmpm(newAmpm);
    if (newAmpm === "PM" && selHour < 12) setSelHour(h => h + 12);
    if (newAmpm === "AM" && selHour >= 12) setSelHour(h => h - 12);
  };

  const handleConfirm = () => {
    const d = new Date(selYear, selMonth, selDate, selHour, selMin, 0, 0);
    onConfirm(d);
  };

  const bg      = theme.colors.surface;
  const text    = theme.colors.text;
  const muted   = theme.colors.textMuted;
  const outline = theme.colors.outline;
  const surfVar = theme.colors.surfaceVariant;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={pickerStyles.overlay}>
        <View style={[pickerStyles.sheet, { backgroundColor: bg }]}>

          {/* ── Tab switcher */}
          <View style={[pickerStyles.tabRow, { borderBottomColor: outline }]}>
            {(["date", "time"] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  pickerStyles.tab,
                  tab === t && { borderBottomColor: primaryColor, borderBottomWidth: 2 },
                ]}
                onPress={() => setTab(t)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={t === "date" ? "calendar-outline" : "time-outline"}
                  size={16}
                  color={tab === t ? primaryColor : muted}
                />
                <Text style={[
                  pickerStyles.tabText,
                  { color: tab === t ? primaryColor : muted },
                ]}>
                  {t === "date" ? "Date" : "Time"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Selected display */}
          <View style={[pickerStyles.selectedBar, { backgroundColor: primaryColor + "18" }]}>
            <Ionicons name="calendar" size={14} color={primaryColor} />
            <Text style={[pickerStyles.selectedText, { color: primaryColor }]}>
              {formatDisplayDate(
                new Date(selYear, selMonth, selDate, selHour, selMin)
              )}
            </Text>
          </View>

          {tab === "date" ? (
            <>
              {/* Month nav */}
              <View style={pickerStyles.monthNav}>
                <TouchableOpacity onPress={prevMonth} hitSlop={12} activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={22} color={text} />
                </TouchableOpacity>
                <Text style={[pickerStyles.monthLabel, { color: text }]}>
                  {MONTHS[viewMonth]} {viewYear}
                </Text>
                <TouchableOpacity onPress={nextMonth} hitSlop={12} activeOpacity={0.7}>
                  <Ionicons name="chevron-forward" size={22} color={text} />
                </TouchableOpacity>
              </View>

              {/* Weekday headers */}
              <View style={pickerStyles.weekRow}>
                {WEEKDAYS.map(d => (
                  <Text key={d} style={[pickerStyles.weekday, { color: muted }]}>{d}</Text>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={pickerStyles.grid}>
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const day = idx - firstDay + 1;
                  const valid = day >= 1 && day <= daysInMonth;
                  const isSel = valid && isSelected(day);
                  const isTod = valid && isToday(day);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        pickerStyles.cell,
                        isSel && { backgroundColor: primaryColor, borderRadius: 22 },
                        !isSel && isTod && { borderRadius: 22, borderWidth: 1.5, borderColor: primaryColor },
                      ]}
                      onPress={() => valid && selectDay(day)}
                      activeOpacity={valid ? 0.75 : 1}
                    >
                      <Text style={[
                        pickerStyles.cellText,
                        { color: !valid ? "transparent" : isSel ? "#FFF" : isTod ? primaryColor : text },
                        isSel && { fontWeight: "700" },
                      ]}>
                        {valid ? day : ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick jump to today */}
              <TouchableOpacity
                style={[pickerStyles.todayBtn, { borderColor: primaryColor + "55" }]}
                onPress={() => {
                  setViewYear(todayY); setViewMonth(todayM);
                  setSelDate(todayD);  setSelMonth(todayM); setSelYear(todayY);
                }}
                activeOpacity={0.7}
              >
                <Text style={[pickerStyles.todayBtnText, { color: primaryColor }]}>
                  Today
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ── TIME TAB */
            <View style={pickerStyles.timeTab}>
              {/* Hour */}
              <View style={pickerStyles.spinnerCol}>
                <TouchableOpacity onPress={() => adjustHour(1)} hitSlop={16} activeOpacity={0.7}>
                  <Ionicons name="chevron-up" size={26} color={primaryColor} />
                </TouchableOpacity>
                <View style={[pickerStyles.spinnerBox, { borderColor: outline, backgroundColor: surfVar }]}>
                  <Text style={[pickerStyles.spinnerVal, { color: text }]}>
                    {String(display12Hour).padStart(2, "0")}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => adjustHour(-1)} hitSlop={16} activeOpacity={0.7}>
                  <Ionicons name="chevron-down" size={26} color={primaryColor} />
                </TouchableOpacity>
                <Text style={[pickerStyles.spinnerLabel, { color: muted }]}>Hour</Text>
              </View>

              <Text style={[pickerStyles.colon, { color: text }]}>:</Text>

              {/* Minute */}
              <View style={pickerStyles.spinnerCol}>
                <TouchableOpacity onPress={() => adjustMin(1)} hitSlop={16} activeOpacity={0.7}>
                  <Ionicons name="chevron-up" size={26} color={primaryColor} />
                </TouchableOpacity>
                <View style={[pickerStyles.spinnerBox, { borderColor: outline, backgroundColor: surfVar }]}>
                  <Text style={[pickerStyles.spinnerVal, { color: text }]}>
                    {String(selMin).padStart(2, "0")}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => adjustMin(-1)} hitSlop={16} activeOpacity={0.7}>
                  <Ionicons name="chevron-down" size={26} color={primaryColor} />
                </TouchableOpacity>
                <Text style={[pickerStyles.spinnerLabel, { color: muted }]}>Min</Text>
              </View>

              {/* AM / PM toggle */}
              <View style={pickerStyles.ampmCol}>
                {(["AM", "PM"] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={toggleAmpm}
                    style={[
                      pickerStyles.ampmBtn,
                      ampm === p
                        ? { backgroundColor: primaryColor }
                        : { backgroundColor: surfVar, borderColor: outline, borderWidth: 1 },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      pickerStyles.ampmText,
                      { color: ampm === p ? "#FFF" : muted },
                    ]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Action buttons */}
          <View style={pickerStyles.actions}>
            <TouchableOpacity
              style={[pickerStyles.cancelAction, { borderColor: outline }]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[pickerStyles.cancelActionText, { color: muted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pickerStyles.confirmAction, { backgroundColor: primaryColor }]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={pickerStyles.confirmActionText}>Confirm</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    width: "90%",
    maxWidth: 360,
    borderRadius: 24,
    paddingBottom: 20,
    overflow: "hidden",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 14, fontWeight: "600" },

  selectedBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 10,
  },
  selectedText: { fontSize: 13, fontWeight: "600" },

  // Calendar
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  monthLabel: { fontSize: 16, fontWeight: "700" },
  weekRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: { fontSize: 14 },

  todayBtn: {
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  todayBtnText: { fontSize: 13, fontWeight: "600" },

  // Time
  timeTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 12,
  },
  spinnerCol: {
    alignItems: "center",
    gap: 10,
  },
  spinnerBox: {
    width: 72,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerVal: { fontSize: 30, fontWeight: "700" },
  spinnerLabel: { fontSize: 11, fontWeight: "500" },
  colon: { fontSize: 30, fontWeight: "700", marginBottom: 22 },
  ampmCol: { gap: 10, marginBottom: 22 },
  ampmBtn: {
    width: 54,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ampmText: { fontSize: 14, fontWeight: "700" },

  // Actions
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cancelAction: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
  },
  cancelActionText: { fontSize: 15, fontWeight: "600" },
  confirmAction: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmActionText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddTaskScreen() {
  const { theme }   = useAppTheme();
  const { addTask } = useTasks();
  const { width }   = useWindowDimensions();
  const insets      = useSafeAreaInsets();

  const scale         = Math.min(width / BASE_WIDTH, 1.35);
  const NAV_HEIGHT    = Math.round(64 * scale);
  const safeBottom    = Platform.OS === "ios" ? insets.bottom : Math.max(insets.bottom, 8);
  const bottomPadding = NAV_HEIGHT + safeBottom + 72;

  // ── Core form state
  const [mainTask, setMainTask] = useState("");
  const [whenDate, setWhenDate] = useState<Date | null>(null);
  const [location, setLocation] = useState("");
  const [reminder, setReminder] = useState("");
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);

  // ── AI state
  const [aiMeta, setAiMeta] = useState(DEFAULT_AI_META);

  // ── UI state
  const [aiLoading,          setAiLoading]          = useState(false);
  const [aiError,            setAiError]            = useState<string | null>(null);
  const [locationDialog,     setLocationDialog]     = useState(false);
  const [subTaskDialog,      setSubTaskDialog]      = useState(false);
  const [isRecording,        setIsRecording]        = useState(false);
  const [showDatePicker,     setShowDatePicker]     = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  // ── Display string for "when" row
  const whenDisplay = whenDate ? formatDisplayDate(whenDate) : "";

  // ── Smart reminder options
  const reminderOptions = useMemo(() => {
    const dur = aiMeta.totalDurationMinutes;
    if (dur <= 0) return ALL_REMINDER_OPTIONS;

    const filtered = ALL_REMINDER_OPTIONS.filter(
      o => o.value === "0" || parseInt(o.value, 10) >= dur
    );
    const exactExists = ALL_REMINDER_OPTIONS.some(o => parseInt(o.value, 10) === dur);
    if (!exactExists) {
      return [
        { label: `${formatDuration(dur)} before (recommended)`, value: String(dur), recommended: true },
        ...filtered,
      ];
    }
    return filtered.map(o =>
      parseInt(o.value, 10) === dur
        ? { ...o, label: `${o.label} (recommended)`, recommended: true }
        : o
    );
  }, [aiMeta.totalDurationMinutes]);

  const getReminderDisplayText = (val: string): string => {
    if (!val) return "Set reminder";
    const dur = aiMeta.totalDurationMinutes;
    if (dur > 0 && parseInt(val, 10) === dur) return `${formatDuration(dur)} before (recommended)`;
    const opt = ALL_REMINDER_OPTIONS.find(o => o.value === val);
    return opt ? opt.label : "Set reminder";
  };

  // ── Speech recognition
  const speechAvailable = ExpoSpeechRecognitionModule !== null;

  useSpeechRecognitionEvent("result", (e) => setMainTask(e.results[0]?.transcript ?? ""));
  useSpeechRecognitionEvent("error",  () => setIsRecording(false));
  useSpeechRecognitionEvent("end",    () => setIsRecording(false));

  const startRecording = async () => {
    if (!speechAvailable) return;
    setMainTask("");
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) return;
    ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: true });
    setIsRecording(true);
  };
  const stopRecording = () => {
    if (!speechAvailable) return;
    ExpoSpeechRecognitionModule.stop();
    setIsRecording(false);
  };

  // ── Navigation
  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  // ── Sub-task helpers
  const toggleSubTask = (id: string) =>
    setSubTasks(prev => prev.map(t => t.id === id ? { ...t, isAdding: !t.isAdding } : t));

  const addSubTask = (value: string) => {
    const text = value.trim();
    if (!text) return;

    setSubTasks((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        text,
        isAdding: true,
        isGenarated: false,
        isDone: false,
      },
    ]);
    setSubTaskDialog(false);
  };

  // ── AI breakdown
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
      if (!res.ok) throw new Error(data?.error || "Failed to break into steps");

      const steps: string[]         = Array.isArray(data?.steps)         ? data.steps         : [];
      const stepDurations: number[] = Array.isArray(data?.stepDurations) ? data.stepDurations : [];

      if (steps.length > 0) {
        setSubTasks(steps.map((text, i) => ({
          id:              String(Date.now() + i),
          text,
          isAdding:        true,
          isGenarated:     true,
          isDone:          false,
          durationMinutes: stepDurations[i] ?? 0,
        })));
      }

      // Parse AI-returned date string into a real Date
      if (typeof data?.when === "string" && data.when.trim()) {
        const parsed = parseAiDate(data.when.trim());
        if (parsed) setWhenDate(parsed);
      }

      const totalDur =
        typeof data?.totalDurationMinutes === "number" && data.totalDurationMinutes > 0
          ? data.totalDurationMinutes : 0;

      setAiMeta({
        title:                typeof data?.title    === "string" && data.title.trim()    ? data.title.trim()    : null,
        category:             typeof data?.category === "string" && data.category.trim() ? data.category.trim() : "Personal",
        emoji:                typeof data?.emoji    === "string" && data.emoji.trim()    ? data.emoji.trim()    : "📋",
        iconBg:               typeof data?.iconBg   === "string" && data.iconBg.trim()   ? data.iconBg.trim()   : "#E8E4FF",
        totalDurationMinutes: totalDur,
      });

      // Auto-set recommended reminder if not already set
      if (!reminder && totalDur > 0) setReminder(String(totalDur));

    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      const elapsed = Date.now() - startTime;
      const rem     = 700 - elapsed;
      if (rem > 0) setTimeout(() => setAiLoading(false), rem);
      else setAiLoading(false);
    }
  };

  // ── Save task
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
      time:     whenDate ? formatDisplayDate(whenDate) : "No time",
      dueDate:  whenDate ? whenDate.toISOString() : undefined,
      location: location.trim() || undefined,
      reminder: reminder.trim() || undefined,
      status:   "todo",
      isSynced: false,
      dateKey,
      subtasks: subTasks,
    });

    // Reset
    setMainTask(""); setWhenDate(null); setLocation(""); setReminder("");
    setSubTasks([]); setAiMeta(DEFAULT_AI_META); setAiError(null);

    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const inputBg  = theme.colors.surface       ?? "#FFFFFF";
  const rowBg    = theme.colors.surfaceVariant ?? "#F5F5F5";
  const editTint = theme.colors.primary + "CC";

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      {/* Loading overlay */}
      {aiLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.surfaceVariant }]}>
          <SparkleLoader />
        </View>
      )}

      {/* Calendar + Time picker modal */}
      <DateTimePickerModal
        visible={showDatePicker}
        initial={whenDate}
        onConfirm={(d) => { setWhenDate(d); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
        primaryColor={theme.colors.primary}
        theme={theme}
      />

      {/* Location dialog */}
      <InputDialog
        visible={locationDialog}
        hideDialog={() => setLocationDialog(false)}
        title="Add location"
        onSubmit={(v) => { setLocation(v.trim()); setLocationDialog(false); }}
        initialValue={location}
        placeholder="e.g. Whole Foods"
      />

      <InputDialog
        visible={subTaskDialog}
        hideDialog={() => setSubTaskDialog(false)}
        title="Add sub-task"
        onSubmit={addSubTask}
        
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} hitSlop={12} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>New Task</Text>
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
          {/* Main task input */}
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

          {/* AI error */}
          {aiError ? (
            <Text style={[styles.aiError, { color: theme.colors.error }]}>{aiError}</Text>
          ) : null}

          {/* AI breakdown button */}
          <TouchableOpacity
            style={[styles.aiButton, {
              backgroundColor: theme.colors.primary,
              opacity: aiLoading ? 0.7 : 1,
            }]}
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

          {/* AI title + category row */}
          {aiMeta.title ? (
            <View style={[styles.aiTitleRow, { backgroundColor: rowBg }]}>
              <Text style={styles.aiTitleEmoji}>{aiMeta.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiTitleLabel, { color: theme.colors.textMuted }]}>Task title</Text>
                <Text style={[styles.aiTitleValue, { color: theme.colors.text }]}>{aiMeta.title}</Text>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + "22" }]}>
                <Text style={[styles.categoryBadgeText, { color: theme.colors.primary }]}>
                  {aiMeta.category}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Duration estimate */}
          {aiMeta.totalDurationMinutes > 0 ? (
            <View style={[styles.durationRow, { backgroundColor: theme.colors.primary + "15" }]}>
              <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.durationText, { color: theme.colors.primary }]}>
                Estimated time:{" "}
                <Text style={{ fontWeight: "700" }}>
                  {formatDuration(aiMeta.totalDurationMinutes)}
                </Text>
              </Text>
            </View>
          ) : null}

          {/* ── When — opens calendar picker */}
          <TouchableOpacity
            style={[styles.detailRow, { backgroundColor: rowBg }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={22} color={theme.colors.primary} />
            <View style={styles.detailTextWrap}>
              <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>When</Text>
              <Text style={[
                styles.detailValue,
                { color: whenDate ? theme.colors.text : theme.colors.textMuted },
              ]}>
                {whenDisplay || "Set date & time"}
              </Text>
            </View>
            {whenDate ? (
              <TouchableOpacity
                hitSlop={12}
                onPress={(e) => { e.stopPropagation(); setWhenDate(null); }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={editTint} />
            )}
          </TouchableOpacity>

          {/* ── Location */}
          <TouchableOpacity
            style={[styles.detailRow, { backgroundColor: rowBg }]}
            onPress={() => setLocationDialog(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={22} color={theme.colors.primary} />
            <View style={styles.detailTextWrap}>
              <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Location</Text>
              <Text style={[
                styles.detailValue,
                { color: location ? theme.colors.text : theme.colors.textMuted },
              ]}>
                {location || "Add location"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={editTint} />
          </TouchableOpacity>

          {/* ── Reminder */}
          <TouchableOpacity
            style={[styles.detailRow, { backgroundColor: rowBg }]}
            onPress={() => setShowReminderPicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={22} color="#E65100" />
            <View style={styles.detailTextWrap}>
              <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Reminder</Text>
              <Text style={[
                styles.detailValue,
                { color: reminder ? theme.colors.text : theme.colors.textMuted },
              ]}>
                {getReminderDisplayText(reminder)}
              </Text>
            </View>
            {aiMeta.totalDurationMinutes > 0 && !reminder && (
              <View style={[styles.recommendedDot, { backgroundColor: theme.colors.primary }]} />
            )}
            <Ionicons name="chevron-forward" size={18} color={editTint} />
          </TouchableOpacity>

          {/* ── Sub-tasks */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sub task</Text>

          {subTasks.map((st) => (
            <TouchableOpacity
              key={st.id}
              style={[styles.subTaskRow, { backgroundColor: rowBg }]}
              onPress={() => toggleSubTask(st.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, {
                borderColor:     theme.colors.textMuted,
                backgroundColor: st.isAdding ? theme.colors.primary : "transparent",
              }]}>
                {st.isAdding && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text
                style={[styles.subTaskText, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {st.text}
              </Text>
              {st.durationMinutes && st.durationMinutes > 0 ? (
                <View style={[styles.durationBadge, { backgroundColor: theme.colors.primary + "18" }]}>
                  <Ionicons name="time-outline" size={11} color={theme.colors.primary} />
                  <Text style={[styles.durationBadgeText, { color: theme.colors.primary }]}>
                    {formatDuration(st.durationMinutes)}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}

          {/* Add sub-task */}
          <TouchableOpacity
            style={[styles.addSubTaskBtn, { borderColor: theme.colors.primary }]}
            onPress={() => setSubTaskDialog(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={theme.colors.primary} />
            <Text style={[styles.addSubTaskText, { color: theme.colors.primary }]}>
              Add sub-task
            </Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveButton, {
              backgroundColor: theme.colors.primary,
              opacity: !mainTask.trim() ? 0.5 : 1,
            }]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={!mainTask.trim()}
          >
            <Text style={styles.saveButtonText}>Save Task</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Reminder picker modal */}
        {showReminderPicker && (
          <View style={styles.overlaySheet}>
            <View style={[styles.bottomSheet, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                Set Reminder
              </Text>

              {aiMeta.totalDurationMinutes > 0 && (
                <View style={[styles.reminderHint, { backgroundColor: theme.colors.primary + "15" }]}>
                  <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
                  <Text style={[styles.reminderHintText, { color: theme.colors.primary }]}>
                    Task takes ~{formatDuration(aiMeta.totalDurationMinutes)} — options below{" "}
                    have enough lead time
                  </Text>
                </View>
              )}

              <ScrollView showsVerticalScrollIndicator={false}>
                {reminderOptions.map((opt: any) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.sheetOption, { borderBottomColor: theme.colors.outline }]}
                    onPress={() => { setReminder(opt.value); setShowReminderPicker(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.sheetOptionText,
                        { color: opt.recommended ? theme.colors.primary : theme.colors.text },
                        opt.recommended && { fontWeight: "700" },
                      ]}>
                        {opt.label}
                      </Text>
                    </View>
                    {opt.recommended && (
                      <View style={[styles.recommendedBadge, { backgroundColor: theme.colors.primary + "22" }]}>
                        <Text style={[styles.recommendedBadgeText, { color: theme.colors.primary }]}>
                          recommended
                        </Text>
                      </View>
                    )}
                    {reminder === opt.value && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} style={{ marginLeft: 8 }} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.sheetCancel, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={() => setShowReminderPicker(false)}
              >
                <Text style={[styles.sheetCancelText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <Nav />
    </SafeAreaView>
  );
}

// ─── Parse AI date string "19 Mar 2026, 6.00 pm" → Date ──────────────────────
function parseAiDate(str: string): Date | null {
  try {
    // "19 Mar 2026, 6.00 pm"
    const rx = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4}), (\d{1,2})\.(\d{2}) (am|pm)$/i;
    const m  = str.match(rx);
    if (!m) return null;
    const [, day, mon, year, hStr, minStr, ap] = m;
    const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthIdx = MONTHS_SHORT.indexOf(mon);
    if (monthIdx === -1) return null;
    let hour = parseInt(hStr, 10);
    const min = parseInt(minStr, 10);
    if (ap.toLowerCase() === "pm" && hour !== 12) hour += 12;
    if (ap.toLowerCase() === "am" && hour === 12) hour = 0;
    return new Date(parseInt(year, 10), monthIdx, parseInt(day, 10), hour, min, 0, 0);
  } catch { return null; }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex:      { flex: 1 },

  loadingOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
  },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  bellWrap:    { position: "relative" },
  bellDot:     { position: "absolute", top: 0, right: 0, width: 8, height: 8, borderRadius: 4 },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, flexGrow: 1 },

  mainInput: {
    paddingHorizontal: 0, paddingVertical: 16, paddingBottom: 35,
    fontSize: 16, minHeight: 100, marginBottom: 16,
  },
  micButton: {
    position: "absolute", right: 10, bottom: 25,
    justifyContent: "center", alignItems: "center",
  },

  aiError:  { fontSize: 14, marginBottom: 8 },
  aiButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 14, gap: 10, marginBottom: 16,
  },
  aiButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },

  aiTitleRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, marginBottom: 8, gap: 12,
  },
  aiTitleEmoji:      { fontSize: 24 },
  aiTitleLabel:      { fontSize: 12, fontWeight: "500", marginBottom: 2 },
  aiTitleValue:      { fontSize: 15, fontWeight: "700" },
  categoryBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  categoryBadgeText: { fontSize: 12, fontWeight: "600" },

  durationRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginBottom: 12,
  },
  durationText: { fontSize: 13 },

  detailRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 14, marginBottom: 10, gap: 12,
  },
  detailTextWrap: { flex: 1 },
  detailLabel:    { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  detailValue:    { fontSize: 15, fontWeight: "600" },
  recommendedDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 8, marginBottom: 12 },

  subTaskRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 14, marginBottom: 8, gap: 12,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  subTaskText: { flex: 1, fontSize: 15, fontWeight: "500" },
  durationBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  durationBadgeText: { fontSize: 11, fontWeight: "600" },

  addSubTaskBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: 14, borderWidth: 1.5,
    borderStyle: "dashed", marginTop: 8, gap: 8,
  },
  addSubTaskText: { fontSize: 15, fontWeight: "600" },

  saveButton: {
    paddingVertical: 16, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginTop: 28,
  },
  saveButtonText: { color: "#FFF", fontSize: 17, fontWeight: "700" },

  // Reminder sheet
  overlaySheet: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center", zIndex: 1000,
  },
  bottomSheet: {
    width: "88%", maxWidth: 360, borderRadius: 20,
    paddingVertical: 20, maxHeight: "80%",
  },
  sheetTitle: {
    fontSize: 18, fontWeight: "700", textAlign: "center",
    marginBottom: 16, paddingHorizontal: 20,
  },
  reminderHint: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  reminderHintText: { fontSize: 12, fontWeight: "500", flex: 1 },
  sheetOption: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1,
  },
  sheetOptionText:      { fontSize: 15 },
  recommendedBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 4 },
  recommendedBadgeText: { fontSize: 11, fontWeight: "700" },
  sheetCancel: {
    marginTop: 12, marginHorizontal: 16,
    paddingVertical: 14, borderRadius: 12, alignItems: "center",
  },
  sheetCancelText: { fontSize: 16, fontWeight: "600" },
});
