import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface BreakActivityModalProps {
  visible: boolean;
  onClose: () => void;
  sessionDurationMinutes: number;
}

// ─── Eye Rest Activity ────────────────────────────────────────────────────────

function EyeRestActivity({ onDone, theme }: { onDone: () => void; theme: any }) {
  const [round, setRound] = useState(1);
  const [seconds, setSeconds] = useState(20);
  const [finished, setFinished] = useState(false);
  const TOTAL_ROUNDS = 3;

  useEffect(() => {
    if (finished) return;
    if (seconds <= 0) {
      if (round < TOTAL_ROUNDS) {
        setRound((r) => r + 1);
        setSeconds(20);
      } else {
        setFinished(true);
      }
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, round, finished]);

  return (
    <View style={actStyles.container}>
      <Text style={[actStyles.emoji]}>👀</Text>
      <Text style={[actStyles.title, { color: theme.colors.text }]}>
        20-20-20 Eye Rest
      </Text>
      <Text style={[actStyles.instruction, { color: theme.colors.textMuted }]}>
        Look at something 20 feet away for 20 seconds.{"\n"}
        Reduces eye strain from screen time.
      </Text>

      {!finished ? (
        <>
          <View style={[actStyles.countdownCircle, { borderColor: theme.colors.primary }]}>
            <Text style={[actStyles.countdownNumber, { color: theme.colors.primary }]}>
              {seconds}
            </Text>
            <Text style={[actStyles.countdownLabel, { color: theme.colors.textMuted }]}>
              seconds
            </Text>
          </View>
          <Text style={[actStyles.roundText, { color: theme.colors.textMuted }]}>
            Round {round} of {TOTAL_ROUNDS}
          </Text>
        </>
      ) : (
        <View style={[actStyles.doneBox, { backgroundColor: theme.colors.primary + "18" }]}>
          <Ionicons name="checkmark-circle" size={32} color={theme.colors.primary} />
          <Text style={[actStyles.doneText, { color: theme.colors.primary }]}>
            Eyes refreshed! ✨
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[actStyles.doneButton, { backgroundColor: theme.colors.primary }]}
        onPress={onDone}
        activeOpacity={0.85}
      >
        <Text style={actStyles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Breathing Activity ───────────────────────────────────────────────────────

type BreathPhase = "inhale" | "hold" | "exhale" | "rest";

const BREATH_PHASES: { phase: BreathPhase; duration: number; label: string }[] = [
  { phase: "inhale", duration: 4, label: "Inhale" },
  { phase: "hold",   duration: 7, label: "Hold"   },
  { phase: "exhale", duration: 8, label: "Exhale" },
  { phase: "rest",   duration: 1, label: "Rest"   },
];

function BreathingActivity({ onDone, theme }: { onDone: () => void; theme: any }) {
  const TOTAL_CYCLES = 3;
  const [cycle, setCycle] = useState(1);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [seconds, setSeconds] = useState(BREATH_PHASES[0].duration);
  const [finished, setFinished] = useState(false);
  const circleAnim = useRef(new Animated.Value(0.6)).current;

  const currentPhase = BREATH_PHASES[phaseIdx];

  useEffect(() => {
    if (finished) return;

    // Animate circle based on phase
    const toValue =
      currentPhase.phase === "inhale" ? 1 :
      currentPhase.phase === "hold"   ? 1 :
      currentPhase.phase === "exhale" ? 0.6 : 0.6;

    Animated.timing(circleAnim, {
      toValue,
      duration: currentPhase.duration * 1000,
      useNativeDriver: true,
    }).start();
  }, [phaseIdx, finished]);

  useEffect(() => {
    if (finished) return;
    if (seconds <= 0) {
      const nextPhaseIdx = (phaseIdx + 1) % BREATH_PHASES.length;
      if (nextPhaseIdx === 0) {
        if (cycle >= TOTAL_CYCLES) {
          setFinished(true);
          return;
        }
        setCycle((c) => c + 1);
      }
      setPhaseIdx(nextPhaseIdx);
      setSeconds(BREATH_PHASES[nextPhaseIdx].duration);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, phaseIdx, cycle, finished]);

  const phaseColors: Record<BreathPhase, string> = {
    inhale: theme.colors.primary,
    hold:   "#f59e0b",
    exhale: "#6366f1",
    rest:   theme.colors.textMuted,
  };

  return (
    <View style={actStyles.container}>
      <Text style={actStyles.emoji}>🌬️</Text>
      <Text style={[actStyles.title, { color: theme.colors.text }]}>
        4-7-8 Breathing
      </Text>
      <Text style={[actStyles.instruction, { color: theme.colors.textMuted }]}>
        Calms your nervous system and{"\n"}reduces stress after a long session.
      </Text>

      {!finished ? (
        <>
          <View style={actStyles.breathCircleWrap}>
            <Animated.View
              style={[
                actStyles.breathCircle,
                {
                  borderColor: phaseColors[currentPhase.phase],
                  backgroundColor: phaseColors[currentPhase.phase] + "22",
                  transform: [{ scale: circleAnim }],
                },
              ]}
            >
              <Text style={[actStyles.breathPhaseLabel, { color: phaseColors[currentPhase.phase] }]}>
                {currentPhase.label}
              </Text>
              <Text style={[actStyles.breathSeconds, { color: phaseColors[currentPhase.phase] }]}>
                {seconds}s
              </Text>
            </Animated.View>
          </View>
          <Text style={[actStyles.roundText, { color: theme.colors.textMuted }]}>
            Cycle {cycle} of {TOTAL_CYCLES}
          </Text>
        </>
      ) : (
        <View style={[actStyles.doneBox, { backgroundColor: theme.colors.primary + "18" }]}>
          <Ionicons name="checkmark-circle" size={32} color={theme.colors.primary} />
          <Text style={[actStyles.doneText, { color: theme.colors.primary }]}>
            Breathing complete! 🧘
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[actStyles.doneButton, { backgroundColor: theme.colors.primary }]}
        onPress={onDone}
        activeOpacity={0.85}
      >
        <Text style={actStyles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Stretch Activity ─────────────────────────────────────────────────────────

const STRETCH_STEPS = [
  { title: "Neck Rolls",       icon: "🔄", instruction: "Slowly roll your head in a circle,\n5 times clockwise, 5 times counter-clockwise." },
  { title: "Shoulder Shrugs",  icon: "🤷", instruction: "Raise both shoulders to your ears,\nhold for 3 seconds, then release. Repeat 5 times." },
  { title: "Standing Stretch", icon: "🙆", instruction: "Stand up and reach both arms above your head.\nInterlace fingers and stretch upward for 10 seconds." },
  { title: "Wrist Circles",    icon: "🤲", instruction: "Extend both arms and rotate your wrists\n10 times in each direction." },
];

function StretchActivity({ onDone, theme }: { onDone: () => void; theme: any }) {
  const [step, setStep] = useState(0);
  const current = STRETCH_STEPS[step];
  const isLast = step === STRETCH_STEPS.length - 1;

  return (
    <View style={actStyles.container}>
      <Text style={actStyles.emoji}>🧘</Text>
      <Text style={[actStyles.title, { color: theme.colors.text }]}>
        Stretch Break
      </Text>
      <Text style={[actStyles.instruction, { color: theme.colors.textMuted }]}>
        Follow each stretch to release tension{"\n"}built up during your focus session.
      </Text>

      <View style={[actStyles.stretchCard, { backgroundColor: theme.colors.surfaceVariant ?? theme.colors.surface }]}>
        <Text style={actStyles.stretchStepIcon}>{current.icon}</Text>
        <Text style={[actStyles.stretchStepTitle, { color: theme.colors.text }]}>
          {step + 1}. {current.title}
        </Text>
        <Text style={[actStyles.stretchStepInstruction, { color: theme.colors.textMuted }]}>
          {current.instruction}
        </Text>
        <View style={actStyles.stretchDots}>
          {STRETCH_STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                actStyles.stretchDot,
                {
                  backgroundColor:
                    i === step ? theme.colors.primary : theme.colors.outline,
                  width: i === step ? 16 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[actStyles.doneButton, { backgroundColor: theme.colors.primary }]}
        onPress={isLast ? onDone : () => setStep((s) => s + 1)}
        activeOpacity={0.85}
      >
        <Text style={actStyles.doneButtonText}>
          {isLast ? "Done" : "Next →"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function BreakActivityModal({
  visible,
  onClose,
  sessionDurationMinutes,
}: BreakActivityModalProps) {
  const { theme } = useAppTheme();

  const activityType =
    sessionDurationMinutes < 25 ? "eye" :
    sessionDurationMinutes <= 45 ? "breathe" : "stretch";

  const activityTitle =
    activityType === "eye"     ? "Eye Rest" :
    activityType === "breathe" ? "Breathing Exercise" : "Stretch Break";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[s.overlay]}>
        <View style={[s.sheet, { backgroundColor: theme.colors.surface }]}>
          {/* Handle */}
          <View style={[s.handle, { backgroundColor: theme.colors.outline }]} />

          {/* Header */}
          <View style={s.header}>
            <Text style={[s.headerTitle, { color: theme.colors.text }]}>
              {activityTitle}
            </Text>
            <TouchableOpacity 
              onPress={onClose} 
              hitSlop={12} 
              activeOpacity={0.7}
              style={s.skipButton}
            >
              <Text style={[s.skipButtonText, { color: theme.colors.primary }]}>
                Skip
              </Text>
            </TouchableOpacity>
          </View>

          {/* Activity */}
          {activityType === "eye"     && <EyeRestActivity    onDone={onClose} theme={theme} />}
          {activityType === "breathe" && <BreathingActivity  onDone={onClose} theme={theme} />}
          {activityType === "stretch" && <StretchActivity    onDone={onClose} theme={theme} />}
        </View>
      </View>
    </Modal>
  );
}

// ─── Shared activity styles ───────────────────────────────────────────────────

const actStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  instruction: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  // Eye rest
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  countdownNumber: {
    fontSize: 40,
    fontWeight: "700",
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: -4,
  },
  roundText: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 24,
  },
  doneBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 24,
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Breathing
  breathCircleWrap: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  breathCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  breathPhaseLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  breathSeconds: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  // Stretch
  stretchCard: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  stretchStepIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  stretchStepTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  stretchStepInstruction: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  stretchDots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  stretchDot: {
    height: 8,
    borderRadius: 4,
  },
  // Shared done button
  doneButton: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  doneButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

// ─── Modal shell styles ───────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});