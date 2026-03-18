import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Timer presets in minutes
const FOCUS_PRESETS = [15, 25, 30, 45, 60];
const BREAK_PRESETS = [5, 10, 15];

type TimerMode = "focus" | "break";

export default function FocusTimer() {
  const { theme } = useAppTheme();
  const router = useRouter();

  // Setup state
  const [mode, setMode] = useState<TimerMode>("focus");
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [customFocusInput, setCustomFocusInput] = useState("");
  const [customBreakInput, setCustomBreakInput] = useState("");

  const handleStartTimer = () => {
    router.push({
      pathname: "/focus-timer-counting",
      params: {
        mode,
        focusDuration: focusDuration.toString(),
        breakDuration: breakDuration.toString(),
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
    // Only allow numbers
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
          <View style={styles.infoBadge}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.onSurfaceVariant} />
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Set up your focus and break durations, then start your session.
        </Text>

        {/* Mode Toggle */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, mode === "focus" && styles.modeButtonActive]}
            onPress={() => setMode("focus")}
          >
            <Ionicons
              name="bulb"
              size={24}
              color={mode === "focus" ? "#fff" : theme.colors.onSurface}
            />
            <Text style={[styles.modeText, mode === "focus" && styles.modeTextActive]}>
              Focus
            </Text>
            <Text style={[styles.modeDuration, mode === "focus" && styles.modeDurationActive]}>
              {focusDuration} min
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modeButton, mode === "break" && styles.modeButtonActive]}
            onPress={() => setMode("break")}
          >
            <Ionicons
              name="cafe"
              size={24}
              color={mode === "break" ? "#fff" : theme.colors.onSurface}
            />
            <Text style={[styles.modeText, mode === "break" && styles.modeTextActive]}>
              Break
            </Text>
            <Text style={[styles.modeDuration, mode === "break" && styles.modeDurationActive]}>
              {breakDuration} min
            </Text>
          </TouchableOpacity>
        </View>

        {/* Duration Selection */}
        <View style={styles.durationSection}>
          <Text style={styles.sectionTitle}>
            {mode === "focus" ? "Focus Duration" : "Break Duration"}
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsScrollContent}
          >
            {(mode === "focus" ? FOCUS_PRESETS : BREAK_PRESETS).map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.presetButton,
                  (mode === "focus" ? focusDuration : breakDuration) === duration &&
                    !isCustomValue() &&
                    styles.presetButtonActive,
                ]}
                onPress={() => handleDurationChange(duration)}
              >
                <Text
                  style={[
                    styles.presetText,
                    (mode === "focus" ? focusDuration : breakDuration) === duration &&
                      !isCustomValue() &&
                      styles.presetTextActive,
                  ]}
                >
                  {duration}
                </Text>
                <Text
                  style={[
                    styles.presetUnit,
                    (mode === "focus" ? focusDuration : breakDuration) === duration &&
                      !isCustomValue() &&
                      styles.presetTextActive,
                  ]}
                >
                  min
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Custom Duration Input */}
          <View style={styles.customInputContainer}>
            <Text style={styles.customInputLabel}>Or set custom time:</Text>
            <View style={[styles.customInputWrapper, isCustomValue() && styles.customInputWrapperActive]}>
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
        </View>

        {/* Session Preview */}
        <View style={styles.previewSection}>
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
                <Text style={styles.previewValue}>{focusDuration + breakDuration} min</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartTimer}>
          <Ionicons name="play" size={24} color="#fff" />
          <Text style={styles.startButtonText}>Start Focus Session</Text>
        </TouchableOpacity>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Tips for better focus</Text>
          <Text style={styles.tipText}>• Put your phone on Do Not Disturb</Text>
          <Text style={styles.tipText}>• Close unnecessary tabs and apps</Text>
          <Text style={styles.tipText}>• Have water nearby to stay hydrated</Text>
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
      backgroundColor: theme.colors.background,
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
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.colors.onBackground,
    },
    infoBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    description: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    modeContainer: {
      flexDirection: "row",
      paddingHorizontal: 24,
      gap: 12,
    },
    modeButton: {
      flex: 1,
      alignItems: "center",
      padding: 20,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      gap: 8,
    },
    modeButtonActive: {
      backgroundColor: mode === "focus" ? theme.colors.primary : theme.colors.secondary,
    },
    modeText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    modeTextActive: {
      color: "#fff",
    },
    modeDuration: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    modeDurationActive: {
      color: "rgba(255,255,255,0.8)",
    },
    durationSection: {
      marginTop: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onBackground,
      marginBottom: 16,
      paddingHorizontal: 24,
    },
    presetsScrollContent: {
      paddingHorizontal: 24,
      gap: 10,
    },
    presetButton: {
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      minWidth: 65,
    },
    presetButtonActive: {
      backgroundColor: mode === "focus" ? theme.colors.primary : theme.colors.secondary,
    },
    presetText: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.onSurface,
    },
    presetUnit: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    presetTextActive: {
      color: "#fff",
    },
    customInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
      paddingHorizontal: 24,
    },
    customInputLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
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
      borderColor: mode === "focus" ? theme.colors.primary : theme.colors.secondary,
    },
    customInput: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
      minWidth: 50,
      textAlign: "center",
    },
    customInputUnit: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    previewSection: {
      paddingHorizontal: 24,
      marginTop: 32,
    },
    previewCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
    },
    previewRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    previewItem: {
      alignItems: "center",
      gap: 6,
    },
    previewLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    previewValue: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    previewDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.background,
    },
    startButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      backgroundColor: theme.colors.primary,
      marginHorizontal: 24,
      marginTop: 32,
      paddingVertical: 18,
      borderRadius: 16,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    startButtonText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#fff",
    },
    tipsSection: {
      paddingHorizontal: 24,
      marginTop: 32,
      backgroundColor: theme.colors.surface,
      marginHorizontal: 24,
      borderRadius: 16,
      padding: 20,
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
