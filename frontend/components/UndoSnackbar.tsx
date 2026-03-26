import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { useTasks } from "../context/TasksContext";

const SNACKBAR_DURATION = 5000;

export default function UndoSnackbar() {
  const { theme } = useAppTheme();
  const { lastDeleted, undoDelete } = useTasks();

  // Slide animation — starts off-screen below
  const slideAnim = useRef(new Animated.Value(500)).current;
  // Progress bar — shrinks from 1 → 0 over 5 seconds
  const progressAnim = useRef(new Animated.Value(1)).current;

  const isVisible = lastDeleted !== null;

  useEffect(() => {
    if (isVisible) {
      // Reset progress bar
      progressAnim.setValue(1);

      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();

      // Shrink progress bar over SNACKBAR_DURATION
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: SNACKBAR_DURATION,
        useNativeDriver: false,
      }).start();
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);



  const s = styles(theme);

   const containerStyle = [
     s.container,
     { transform: [{ translateY: slideAnim }] },
     { pointerEvents: isVisible ? "auto" : "none" },
   ];

   if (!isVisible) {
     containerStyle.push({ display: "none" } as any);
   }

   return (
     <Animated.View style={StyleSheet.flatten(containerStyle as any)}>
      {/* Main row */}
      <View style={s.row}>
        <View style={s.textWrap}>
          <Text style={s.message} numberOfLines={1}>
            Task deleted
          </Text>
          {lastDeleted?.title ? (
            <Text style={s.taskName} numberOfLines={1}>
              {lastDeleted.title}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={s.undoButton}
          onPress={() => {
            if (lastDeleted) undoDelete(lastDeleted);
          }}
          activeOpacity={0.8}
        >
          <Text style={s.undoText}>Undo</Text>
        </TouchableOpacity>
      </View>

      {/* Shrinking progress bar */}
      <View style={s.progressTrack}>
        <Animated.View
          style={[
            s.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 80, // sits above the nav bar
      left: 16,
      right: 16,
      backgroundColor: theme.colors.text,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
      elevation: 8,
      zIndex: 9999,
    },
    hidden: {
      display: "none",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    textWrap: {
      flex: 1,
    },
    message: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.colors.background,
      opacity: 0.7,
    },
    taskName: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.background,
      marginTop: 1,
    },
    undoButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    undoText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFF",
    },
    progressTrack: {
      height: 3,
      backgroundColor: theme.colors.background + "33",
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.colors.primary,
    },
  });