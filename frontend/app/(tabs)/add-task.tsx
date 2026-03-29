/**
 * Add Task screen — full version with:
 *  • Custom inline calendar + time picker (no external dependency)
 *  • Duration estimates per subtask
 *  • Smart reminder filtering based on AI task duration
 *  • AI breakdown with neutralisation + system prompt
 *  • Smart task splitting (> 2 hours)
 *  • Subtask notes (long press)
 *  • Drag to reorder subtasks
 *  • Dependency badges
 *  • Natural language rescheduling
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  ActivityIndicator,
  TextInput as RNTextInput,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { useAppTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TasksContext";
import { API_BASE } from "../../constants/api";
import Nav from "../../components/Nav";
import InputDialog from "../../components/InputDialog";
import { TextInput } from "react-native-paper";
import SparkleLoader from "../../components/SparkleLoader";
import SubtaskNoteModal from "../../components/SubtaskNoteModal";
import DependencyBadge from "../../components/DependencyBadge";
import { saveTemplate } from "../../services/templateStorage";
import { Easings } from "../../utils/animations";

// ── Speech recognition — guarded for Expo Go ─────────────────────────────────
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: (event: string, cb: (e: any) => void) => void = () => { };
try {
  const mod = require("expo-speech-recognition");
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch { /* Expo Go — speech disabled */ }

let _idCounter = 0;
function generateId(): string {
  _idCounter += 1;
  return `st_${Date.now()}_${_idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubTask {
  id: string;
  text: string;
  isAdding: boolean;
  isGenarated: boolean;
  isDone: boolean;
  durationMinutes?: number;
  notes?: string;
  order?: number;
  dependsOn?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLACEHOLDER_MAIN =
  "What needs to be done? Try 'Buy Milk at Whole Foods Tomorrow at 5pm.'";

const BASE_WIDTH = 390;

const DEFAULT_AI_META = {
  title: null as string | null,
  category: "Personal",
  emoji: "📋",
  iconBg: "#E8E4FF",
  totalDurationMinutes: 0,
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ALL_REMINDER_OPTIONS = [
  { label: "At time of task", value: "0" },
  { label: "5 minutes before", value: "5" },
  { label: "15 minutes before", value: "15" },
  { label: "30 minutes before", value: "30" },
  { label: "1 hour before", value: "60" },
  { label: "2 hours before", value: "120" },
  { label: "1 day before", value: "1440" },
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
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);

  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (d.getTime() === today.getTime()) return `Today at ${timeStr}`;
  if (d.getTime() === tomorrow.getTime()) return `Tomorrow at ${timeStr}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + ` at ${timeStr}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ─── Parse AI date string "19 Mar 2026, 6.00 pm" → Date ──────────────────────
function parseAiDate(str: string): Date | null {
  try {
    const rx = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4}), (\d{1,2})\.(\d{2}) (am|pm)$/i;
    const m = str.match(rx);
    if (!m) return null;
    const [, day, mon, year, hStr, minStr, ap] = m;
    const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIdx = MONTHS_SHORT.indexOf(mon);
    if (monthIdx === -1) return null;
    let hour = parseInt(hStr, 10);
    const min = parseInt(minStr, 10);
    if (ap.toLowerCase() === "pm" && hour !== 12) hour += 12;
    if (ap.toLowerCase() === "am" && hour === 12) hour = 0;
    return new Date(parseInt(year, 10), monthIdx, parseInt(day, 10), hour, min, 0, 0);
  } catch { return null; }
}

// ─── Custom Calendar + Time Picker ───────────────────────────────────────────

interface DateTimePickerModalProps {
  visible: boolean;
  initial: Date | null;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  primaryColor: string;
  theme: any;
}

function DateTimePickerModal({
  visible, initial, onConfirm, onCancel, primaryColor, theme,
}: DateTimePickerModalProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(initial?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial?.getMonth() ?? now.getMonth());
  const [selDate, setSelDate] = useState(initial?.getDate() ?? now.getDate());
  const [selYear, setSelYear] = useState(initial?.getFullYear() ?? now.getFullYear());
  const [selMonth, setSelMonth] = useState(initial?.getMonth() ?? now.getMonth());
  const [selHour, setSelHour] = useState(initial?.getHours() ?? 9);
  const [selMin, setSelMin] = useState(
    initial ? Math.floor(initial.getMinutes() / 15) * 15 : 0
  );
  const [ampm, setAmpm] = useState<"AM" | "PM">(
    (initial?.getHours() ?? 9) >= 12 ? "PM" : "AM"
  );
  const [tab, setTab] = useState<"date" | "time">("date");

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const isToday = (d: number) => d === todayD && viewMonth === todayM && viewYear === todayY;
  const isSelected = (d: number) => d === selDate && viewMonth === selMonth && viewYear === selYear;

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

  const display12Hour = selHour === 0 ? 12 : selHour > 12 ? selHour - 12 : selHour;

  const adjustHour = (delta: number) => {
    let h = display12Hour + delta;
    if (h < 1) h = 12;
    if (h > 12) h = 1;
    const hour24 = ampm === "AM"
      ? (h === 12 ? 0 : h)
      : (h === 12 ? 12 : h + 12);
    setSelHour(hour24);
  };

  const adjustMin = (delta: number) => {
    let m = selMin + delta * 15;
    if (m < 0) m = 45;
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

  const bg = theme.colors.surface;
  const text = theme.colors.text;
  const muted = theme.colors.textMuted;
  const outline = theme.colors.outline;
  const surfVar = theme.colors.surfaceVariant;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={pickerStyles.overlay}>
        <View style={[pickerStyles.sheet, { backgroundColor: bg }]}>

          {/* Tab switcher */}
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
                <Text style={[pickerStyles.tabText, { color: tab === t ? primaryColor : muted }]}>
                  {t === "date" ? "Date" : "Time"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected display */}
          <View style={[pickerStyles.selectedBar, { backgroundColor: primaryColor + "18" }]}>
            <Ionicons name="calendar" size={14} color={primaryColor} />
            <Text style={[pickerStyles.selectedText, { color: primaryColor }]}>
              {formatDisplayDate(new Date(selYear, selMonth, selDate, selHour, selMin))}
            </Text>
          </View>

          {tab === "date" ? (
            <>
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

              <View style={pickerStyles.weekRow}>
                {WEEKDAYS.map(d => (
                  <Text key={d} style={[pickerStyles.weekday, { color: muted }]}>{d}</Text>
                ))}
              </View>

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

              <TouchableOpacity
                style={[pickerStyles.todayBtn, { borderColor: primaryColor + "55" }]}
                onPress={() => {
                  setViewYear(todayY); setViewMonth(todayM);
                  setSelDate(todayD); setSelMonth(todayM); setSelYear(todayY);
                }}
                activeOpacity={0.7}
              >
                <Text style={[pickerStyles.todayBtnText, { color: primaryColor }]}>Today</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={pickerStyles.timeTab}>
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
                    <Text style={[pickerStyles.ampmText, { color: ampm === p ? "#FFF" : muted }]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

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
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" },
  sheet: { width: "90%", maxWidth: 360, borderRadius: 24, paddingBottom: 20, overflow: "hidden" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 6, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontSize: 14, fontWeight: "600" },
  selectedBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 10, marginHorizontal: 16, marginTop: 14, marginBottom: 4, borderRadius: 10 },
  selectedText: { fontSize: 13, fontWeight: "600" },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  monthLabel: { fontSize: 16, fontWeight: "700" },
  weekRow: { flexDirection: "row", paddingHorizontal: 12, marginBottom: 4 },
  weekday: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600", paddingVertical: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  cellText: { fontSize: 14 },
  todayBtn: { alignSelf: "center", marginTop: 8, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  todayBtnText: { fontSize: 13, fontWeight: "600" },
  timeTab: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 28, gap: 12 },
  spinnerCol: { alignItems: "center", gap: 10 },
  spinnerBox: { width: 72, height: 64, borderRadius: 16, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  spinnerVal: { fontSize: 30, fontWeight: "700" },
  spinnerLabel: { fontSize: 11, fontWeight: "500" },
  colon: { fontSize: 30, fontWeight: "700", marginBottom: 22 },
  ampmCol: { gap: 10, marginBottom: 22 },
  ampmBtn: { width: 54, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ampmText: { fontSize: 14, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  cancelAction: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1.5 },
  cancelActionText: { fontSize: 15, fontWeight: "600" },
  confirmAction: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  confirmActionText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddTaskScreen() {
  const { theme } = useAppTheme();
  const { addTask, reorderSubtasks, addSubtaskNote, userId } = useTasks();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const scale = Math.min(width / BASE_WIDTH, 1.35);
  const NAV_HEIGHT = Math.round(64 * scale);
  const safeBottom = Platform.OS === "ios" ? insets.bottom : Math.max(insets.bottom, 8);
  const bottomPadding = NAV_HEIGHT + safeBottom + 72;

  // ── Core form state
  const [mainTask, setMainTask] = useState("");
  const [whenDate, setWhenDate] = useState<Date | null>(null);
  const [location, setLocation] = useState("");
  const [reminder, setReminder] = useState("");
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);

  // ── AI state
  const [aiMeta, setAiMeta] = useState(DEFAULT_AI_META);
  const [aiSteps, setAiSteps] = useState<string[]>([]); // raw step strings for split

  // ── UI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [locationDialog, setLocationDialog] = useState(false);
  const [subTaskDialog, setSubTaskDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);


  // ── Smart split state
  const [showSplitCard, setShowSplitCard] = useState(false);
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitError, setSplitError] = useState<string | null>(null);

  // ── Reschedule state
  const [showRescheduleInput, setShowRescheduleInput] = useState(false);
  const [rescheduleText, setRescheduleText] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const rescheduleInputRef = useRef<any>(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);

  const params = useLocalSearchParams();

  // Animation values for entrance
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const inputFade = useRef(new Animated.Value(0)).current;
  const inputSlide = useRef(new Animated.Value(30)).current;
  const aiButtonFade = useRef(new Animated.Value(0)).current;
  const aiButtonSlide = useRef(new Animated.Value(30)).current;
  const detailsFade = useRef(new Animated.Value(0)).current;
  const detailsSlide = useRef(new Animated.Value(30)).current;
  const subtasksFade = useRef(new Animated.Value(0)).current;
  const subtasksSlide = useRef(new Animated.Value(30)).current;
  const saveFade = useRef(new Animated.Value(0)).current;
  const saveSlide = useRef(new Animated.Value(30)).current;

  // Entrance animations
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 300,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 300,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(inputFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(inputSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(aiButtonFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(aiButtonSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(detailsFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(detailsSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtasksFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(subtasksSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(saveFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(saveSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (params.templateTitle) {
      setMainTask(String(params.templateTitle));
      setAiMeta(prev => ({
        ...prev,
        title: String(params.templateTitle),
        category: String(params.templateCategory ?? "Personal"),
        emoji: String(params.templateIcon ?? "📋"),
        iconBg: String(params.templateIconBg ?? "#E8E4FF"),
      }));
    }
    if (params.templateSubtasks) {
      try {
        const parsed = JSON.parse(String(params.templateSubtasks));
        if (Array.isArray(parsed)) {
          setSubTasks(parsed.map(st => ({ ...st, isDone: false })));
        }
      } catch { }
    }
  }, []);

  // ── Subtask note modal state
  const [noteModal, setNoteModal] = useState<{
    visible: boolean;
    subtaskId: string;
    subtaskText: string;
    initialNote: string;
  }>({ visible: false, subtaskId: "", subtaskText: "", initialNote: "" });



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
  useSpeechRecognitionEvent("error", () => setIsRecording(false));
  useSpeechRecognitionEvent("end", () => setIsRecording(false));

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
        id: generateId(),
        text,
        isAdding: true,
        isGenarated: false,
        isDone: false,
      }
    ]);
    setSubTaskDialog(false);
  };

  // ── AI breakdown
  const handleBreakIntoSteps = async () => {
    const taskText = mainTask.trim();
    if (!taskText || aiLoading) return;
    setAiError(null);
    setShowSplitCard(false);
    setSplitError(null);
    setAiLoading(true);
    const startTime = Date.now();

    try {
      const res = await fetch(`${API_BASE}/api/ai/breakdown`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to break into steps");

      const steps: string[] = Array.isArray(data?.steps) ? data.steps : [];
      const stepDurations: number[] = Array.isArray(data?.stepDurations) ? data.stepDurations : [];

      if (steps.length > 0) {
        setSubTasks(steps.map((text, i) => ({
          id: generateId(),
          text,
          isAdding: true,
          isGenarated: true,
          isDone: false,
          durationMinutes: stepDurations[i] ?? 0,
        })));
        setAiSteps(steps);
      }

      if (typeof data?.when === "string" && data.when.trim()) {
        const parsed = parseAiDate(data.when.trim());
        if (parsed) setWhenDate(parsed);
      }

      const totalDur =
        typeof data?.totalDurationMinutes === "number" && data.totalDurationMinutes > 0
          ? data.totalDurationMinutes : 0;

      setAiMeta({
        title: typeof data?.title === "string" && data.title.trim() ? data.title.trim() : null,
        category: typeof data?.category === "string" && data.category.trim() ? data.category.trim() : "Personal",
        emoji: typeof data?.emoji === "string" && data.emoji.trim() ? data.emoji.trim() : "📋",
        iconBg: typeof data?.iconBg === "string" && data.iconBg.trim() ? data.iconBg.trim() : "#E8E4FF",
        totalDurationMinutes: totalDur,
      });

      if (!reminder && totalDur > 0) setReminder(String(totalDur));

      // Show split card if task is > 2 hours
      if (totalDur > 120) setShowSplitCard(true);

    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      const elapsed = Date.now() - startTime;
      const rem = 700 - elapsed;
      if (rem > 0) setTimeout(() => setAiLoading(false), rem);
      else setAiLoading(false);
    }
  };

  // ── Smart split handler
  const handleSplitTask = async () => {
    if (splitLoading) return;
    setSplitError(null);
    setSplitLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/suggest-split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: mainTask.trim(),
          steps: aiSteps,
          totalDurationMinutes: aiMeta.totalDurationMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to split task");

      const splitTasks: Array<{
        title: string;
        steps: string[];
        stepDurations: number[];
        totalDurationMinutes: number;
      }> = Array.isArray(data?.splitTasks) ? data.splitTasks : [];

      if (splitTasks.length === 0) throw new Error("No split tasks returned");

      const today = new Date();
      const dateKey = today.toISOString().slice(0, 10);

      splitTasks.forEach((st) => {
        addTask({
          title: st.title,
          category: aiMeta.category,
          icon: aiMeta.emoji,
          iconBg: aiMeta.iconBg,
          time: "No time",
          status: "todo",
          isSynced: false,
          dateKey,
          subtasks: st.steps.map((text, i) => ({
            id: generateId(),
            text,
            isAdding: true,
            isGenarated: true,
            isDone: false,
            durationMinutes: st.stepDurations[i] ?? 0,
          })),
        });
      });

      setShowSplitCard(false);
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)");

    } catch (e) {
      setSplitError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSplitLoading(false);
    }
  };

  // ── Natural language reschedule handler
  const handleReschedule = async () => {
    const instruction = rescheduleText.trim();
    if (!instruction || rescheduleLoading || !whenDate) return;
    setRescheduleError(null);
    setRescheduleLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          currentDueDate: whenDate.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to reschedule");

      const newDate = parseAiDate(data.newDueDate);
      if (newDate) {
        setWhenDate(newDate);
        setShowRescheduleInput(false);
        setRescheduleText("");
      } else {
        throw new Error("Could not parse the new date");
      }
    } catch (e) {
      setRescheduleError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRescheduleLoading(false);
    }
  };

  // ── Save task
  const handleSave = () => {
    const title = (aiMeta.title ?? mainTask).trim();
    if (!title) return;

    const dateKey = whenDate 
      ? `${whenDate.getFullYear()}-${String(whenDate.getMonth() + 1).padStart(2, "0")}-${String(whenDate.getDate()).padStart(2, "0")}`
      : new Date().toISOString().slice(0, 10);

    addTask({
      title,
      category: aiMeta.category,
      icon: aiMeta.emoji,
      iconBg: aiMeta.iconBg,
      time: whenDate ? formatDisplayDate(whenDate) : "No time",
      dueDate: whenDate ? whenDate.toISOString() : undefined,
      location: location.trim() || undefined,
      reminder: reminder.trim() || undefined,
      status: "todo",
      isSynced: false,
      dateKey,
      subtasks: subTasks,
    });

    setMainTask(""); setWhenDate(null); setLocation(""); setReminder("");
    setSubTasks([]); setAiMeta(DEFAULT_AI_META); setAiError(null);
    setShowSplitCard(false); setAiSteps([]);

    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const handleSaveAsTemplate = async () => {
    if (!userId || templateSaving || subTasks.length === 0) return;
    setTemplateSaving(true);
    setTemplateSaved(false);

    // Build a minimal Task shape for the service
    const pseudoTask = {
      id: "preview",
      title: (aiMeta.title ?? mainTask).trim() || "Untitled",
      category: aiMeta.category,
      icon: aiMeta.emoji,
      iconBg: aiMeta.iconBg,
      subtasks: subTasks,
      status: "todo" as const,
      isSynced: false,
      dateKey: new Date().toISOString().slice(0, 10),
    };

    const result = await saveTemplate(userId, pseudoTask);
    setTemplateSaving(false);
    if (result) setTemplateSaved(true);
  };

  const inputBg = theme.colors.surface ?? "#FFFFFF";
  const rowBg = theme.colors.surfaceVariant ?? "#F5F5F5";
  const editTint = theme.colors.primary + "CC";

  // ── Render subtask row for DraggableFlatList
  const renderSubtaskItem = ({ item: st, drag, isActive }: RenderItemParams<SubTask>) => {
    // Check if this subtask is blocked
    const blockingSubtasks = (st.dependsOn ?? [])
      .map(depId => subTasks.find(s => s.id === depId))
      .filter(Boolean) as SubTask[];
    const isBlocked = blockingSubtasks.some(s => !s.isDone);
    const blockedByTexts = blockingSubtasks.filter(s => !s.isDone).map(s => s.text);

    return (
      <ScaleDecorator>
        <View style={{ opacity: isActive ? 0.85 : 1 }}>
          <TouchableOpacity
            style={[styles.subTaskRow, { backgroundColor: rowBg }]}
            onPress={() => toggleSubTask(st.id)}
            onLongPress={() =>
              setNoteModal({
                visible: true,
                subtaskId: st.id,
                subtaskText: st.text,
                initialNote: st.notes ?? "",
              })
            }
            delayLongPress={400}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, {
              borderColor: theme.colors.textMuted,
              backgroundColor: st.isAdding ? theme.colors.primary : "transparent",
            }]}>
              {st.isAdding && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.subTaskText, { color: theme.colors.text }]} numberOfLines={1}>
                {st.text}
              </Text>
              {/* Note preview */}
              {st.notes ? (
                <Text
                  style={[styles.notePreview, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  📝 {st.notes}
                </Text>
              ) : null}
            </View>

            {st.durationMinutes && st.durationMinutes > 0 ? (
              <View style={[styles.durationBadge, { backgroundColor: theme.colors.primary + "18" }]}>
                <Ionicons name="time-outline" size={11} color={theme.colors.primary} />
                <Text style={[styles.durationBadgeText, { color: theme.colors.primary }]}>
                  {formatDuration(st.durationMinutes)}
                </Text>
              </View>
            ) : null}

            {/* Drag handle */}
            <TouchableOpacity
              onLongPress={drag}
              delayLongPress={100}
              hitSlop={8}
              style={styles.dragHandle}
            >
              <Ionicons name="reorder-three-outline" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Dependency badge */}
          <DependencyBadge
            blockedByTexts={blockedByTexts}
            visible={isBlocked}
          />
        </View>
      </ScaleDecorator>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={styles.container}
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

      {/* Subtask Note Modal */}
      <SubtaskNoteModal
        visible={noteModal.visible}
        onClose={() => setNoteModal(p => ({ ...p, visible: false }))}
        initialNote={noteModal.initialNote}
        subtaskText={noteModal.subtaskText}
        onSave={(note) => {
          setSubTasks(prev =>
            prev.map(st =>
              st.id === noteModal.subtaskId
                ? { ...st, notes: note || undefined }
                : st
            )
          );
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <TouchableOpacity onPress={handleBack} hitSlop={12} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>New Task</Text>
          <View style={styles.bellWrap}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
            <View style={[styles.bellDot, { backgroundColor: theme.colors.primary }]} />
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main task input */}
          <Animated.View 
            style={{ 
              position: "relative",
              opacity: inputFade,
              transform: [{ translateY: inputSlide }],
            }}
          >
            <TextInput
              style={[styles.mainInput, { backgroundColor: inputBg, color: theme.colors.text }]}
              placeholder={PLACEHOLDER_MAIN}
              placeholderTextColor={theme.colors.textMuted}
              value={mainTask}
              onChangeText={(text) => {
                setMainTask(text);
                if (aiMeta.title) setAiMeta(DEFAULT_AI_META);
                if (aiError) setAiError(null);
                if (showSplitCard) setShowSplitCard(false);
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
          </Animated.View>

          {/* AI error */}
          {aiError ? (
            <Text style={[styles.aiError, { color: theme.colors.error }]}>{aiError}</Text>
          ) : null}

          {/* AI breakdown button */}
          <Animated.View
            style={{
              opacity: aiButtonFade,
              transform: [{ translateY: aiButtonSlide }],
            }}
          >
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
          </Animated.View>

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

          {/* ── Smart split card */}
          {showSplitCard ? (
            <View style={[styles.splitCard, { backgroundColor: theme.colors.primary + "12", borderColor: theme.colors.primary + "44" }]}>
              <View style={styles.splitCardHeader}>
                <Text style={styles.splitCardIcon}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.splitCardTitle, { color: theme.colors.text }]}>
                    This task will take {formatDuration(aiMeta.totalDurationMinutes)}
                  </Text>
                  <Text style={[styles.splitCardSub, { color: theme.colors.textMuted }]}>
                    Want to split it across multiple days?
                  </Text>
                </View>
              </View>
              {splitError ? (
                <Text style={[styles.splitError, { color: theme.colors.error }]}>{splitError}</Text>
              ) : null}
              <View style={styles.splitCardButtons}>
                <TouchableOpacity
                  style={[styles.splitKeepBtn, { borderColor: theme.colors.outline }]}
                  onPress={() => { setShowSplitCard(false); setSplitError(null); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.splitKeepText, { color: theme.colors.textMuted }]}>
                    Keep as one
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.splitDoBtn, {
                    backgroundColor: theme.colors.primary,
                    opacity: splitLoading ? 0.7 : 1,
                  }]}
                  onPress={handleSplitTask}
                  disabled={splitLoading}
                  activeOpacity={0.85}
                >
                  {splitLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.splitDoText}>Split it</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* ── When — opens calendar picker */}
          <Animated.View
            style={{
              opacity: detailsFade,
              transform: [{ translateY: detailsSlide }],
            }}
          >
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
              <View style={styles.whenActions}>
                {/* Reschedule link */}
                <TouchableOpacity
                  hitSlop={8}
                  onPress={(e) => {
                    e.stopPropagation();
                    setShowRescheduleInput(v => !v);
                    setRescheduleText("");
                    setRescheduleError(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.rescheduleLink, { color: theme.colors.primary }]}>
                    Reschedule
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  hitSlop={12}
                  onPress={(e) => {
                    e.stopPropagation();
                    setWhenDate(null);
                    setShowRescheduleInput(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={editTint} />
            )}
          </TouchableOpacity>
          </Animated.View>

          {/* ── Reschedule inline input */}
          {showRescheduleInput && whenDate ? (
            <View style={[styles.rescheduleInputRow, { backgroundColor: rowBg }]}>
              <RNTextInput
                ref={rescheduleInputRef}
                style={[styles.rescheduleInput, {
                  color: theme.colors.text,
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.background,
                }]}
                placeholder='e.g. "move to next Monday" or "push to 3pm"'
                placeholderTextColor={theme.colors.textMuted}
                value={rescheduleText}
                onChangeText={setRescheduleText}
                onSubmitEditing={handleReschedule}
                returnKeyType="done"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.rescheduleSubmitBtn, {
                  backgroundColor: theme.colors.primary,
                  opacity: rescheduleLoading || !rescheduleText.trim() ? 0.6 : 1,
                }]}
                onPress={handleReschedule}
                disabled={rescheduleLoading || !rescheduleText.trim()}
                activeOpacity={0.85}
              >
                {rescheduleLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
              {rescheduleError ? (
                <Text style={[styles.rescheduleError, { color: theme.colors.error }]}>
                  {rescheduleError}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* ── Location */}
          <Animated.View
            style={{
              opacity: detailsFade,
              transform: [{ translateY: detailsSlide }],
            }}
          >
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
          </Animated.View>

          {/* ── Reminder */}
          <Animated.View
            style={{
              opacity: detailsFade,
              transform: [{ translateY: detailsSlide }],
            }}
          >
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
          </Animated.View>

          {/* ── Sub-tasks */}
          <Animated.View
            style={{
              opacity: subtasksFade,
              transform: [{ translateY: subtasksSlide }],
            }}
          >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sub task</Text>

          {/* DraggableFlatList — must NOT be inside a ScrollView's scroll direction */}
          <DraggableFlatList
            data={subTasks}
            keyExtractor={(item) => item.id}
            onDragEnd={({ data }) => setSubTasks(data)}
            renderItem={renderSubtaskItem}
            scrollEnabled={false}
            activationDistance={10}
          />

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
          </Animated.View>

          {subTasks.length > 0 && (
            <TouchableOpacity
              style={[
                styles.saveAsTemplateBtn,
                {
                  borderColor: templateSaved ? "#16a34a" : theme.colors.primary,
                  backgroundColor: templateSaved ? "#dcfce7" : theme.colors.primary + "12",
                  opacity: templateSaving ? 0.7 : 1,
                },
              ]}
              onPress={handleSaveAsTemplate}
              disabled={templateSaving || templateSaved}
              activeOpacity={0.8}
            >
              {templateSaving ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons
                  name={templateSaved ? "checkmark-circle" : "bookmark-outline"}
                  size={18}
                  color={templateSaved ? "#16a34a" : theme.colors.primary}
                />
              )}
              <Text style={[styles.saveAsTemplateBtnText, { color: templateSaved ? "#16a34a" : theme.colors.primary }]}>
                {templateSaving ? "Saving…" : templateSaved ? "Saved as template!" : "Save as Template"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Save */}
          <Animated.View
            style={{
              opacity: saveFade,
              transform: [{ translateY: saveSlide }],
            }}
          >
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
          </Animated.View>
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
                    Task takes ~{formatDuration(aiMeta.totalDurationMinutes)} — options below have enough lead time
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  loadingOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
  },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  bellWrap: { position: "relative" },
  bellDot: { position: "absolute", top: 0, right: 0, width: 8, height: 8, borderRadius: 4 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, flexGrow: 1 },

  mainInput: {
    paddingHorizontal: 0, paddingVertical: 16, paddingBottom: 35,
    fontSize: 16, minHeight: 100, marginBottom: 16,
  },
  micButton: {
    position: "absolute", right: 10, bottom: 25,
    justifyContent: "center", alignItems: "center",
  },

  aiError: { fontSize: 14, marginBottom: 8 },
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
  aiTitleEmoji: { fontSize: 24 },
  aiTitleLabel: { fontSize: 12, fontWeight: "500", marginBottom: 2 },
  aiTitleValue: { fontSize: 15, fontWeight: "700" },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  categoryBadgeText: { fontSize: 12, fontWeight: "600" },

  durationRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginBottom: 12,
  },
  durationText: { fontSize: 13 },

  // Smart split card
  splitCard: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 12,
  },
  splitCardHeader: {
    flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12,
  },
  splitCardIcon: { fontSize: 22, marginTop: 1 },
  splitCardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  splitCardSub: { fontSize: 13 },
  splitError: { fontSize: 13, marginBottom: 8 },
  splitCardButtons: { flexDirection: "row", gap: 10 },
  splitKeepBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    alignItems: "center", borderWidth: 1.5,
  },
  splitKeepText: { fontSize: 14, fontWeight: "600" },
  splitDoBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  splitDoText: { color: "#FFF", fontSize: 14, fontWeight: "700" },

  detailRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 14, marginBottom: 10, gap: 12,
  },
  detailTextWrap: { flex: 1 },
  detailLabel: { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: "600" },
  recommendedDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },

  whenActions: {
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  rescheduleLink: {
    fontSize: 13, fontWeight: "600",
  },

  // Reschedule inline input
  rescheduleInputRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, padding: 10, gap: 8,
    marginBottom: 10, flexWrap: "wrap",
  },
  rescheduleInput: {
    flex: 1, fontSize: 14, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, minHeight: 40,
  },
  rescheduleSubmitBtn: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  rescheduleError: {
    width: "100%", fontSize: 12, marginTop: 4,
  },

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
  subTaskText: { fontSize: 15, fontWeight: "500" },
  notePreview: { fontSize: 12, marginTop: 2 },
  dragHandle: { paddingLeft: 4 },
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
  sheetOptionText: { fontSize: 15 },
  recommendedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 4 },
  recommendedBadgeText: { fontSize: 11, fontWeight: "700" },
  sheetCancel: {
    marginTop: 12, marginHorizontal: 16,
    paddingVertical: 14, borderRadius: 12, alignItems: "center",
  },
  sheetCancelText: { fontSize: 16, fontWeight: "600" },

  saveAsTemplateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
    marginTop: 12,
  },
  saveAsTemplateBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});