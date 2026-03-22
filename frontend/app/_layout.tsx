/**
 * app/_layout.tsx  (root layout)
 */

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ImageBackground, StyleSheet, View, Platform } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider, useAppTheme } from "../context/ThemeContext";
import { UserProvider } from "../context/UserContext";
import { TasksProvider } from "../context/TasksContext";
import UndoSnackbar from "../components/UndoSnackbar";

// Clear localStorage on web to prevent Firebase token refresh errors
// This runs before React renders to ensure clean auth state
if (Platform.OS === "web" && typeof window !== "undefined") {
  // Check if we're not in a server-side rendering context
  try {
    // Clear any corrupted Firebase auth tokens that cause 400 errors
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("firebase:")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    // Ignore localStorage errors
  }
}

function AppShell() {
  const { theme } = useAppTheme();

  return (
    <PaperProvider theme={theme}>
      <ImageBackground
        source={require("../assets/bg.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
              animation: "fade",
            }}
          >
            <Stack.Screen
              name="(auth)"
              options={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
              }}
            />

            {/* ── Modal screens ── */}
            <Stack.Screen
              name="templates"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
                contentStyle: { backgroundColor: "transparent" },
              }}
            />
            <Stack.Screen
              name="daily-plan"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
                contentStyle: { backgroundColor: "transparent" },
              }}
            />
          </Stack>

          {/* Global undo snackbar — renders above all screens */}
          <UndoSnackbar />
        </View>
      </ImageBackground>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <TasksProvider>
            <AppShell />
          </TasksProvider>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  content:    { flex: 1 },
});