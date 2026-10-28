/**
 * app/_layout.tsx  (root layout)
 */

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  AppState,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { onAuthStateChanged } from "firebase/auth";

import { ThemeProvider, useAppTheme } from "../context/ThemeContext";
import { UserProvider, useUser } from "../context/UserContext";
import { TasksProvider } from "../context/TasksContext";
import UndoSnackbar from "../components/UndoSnackbar";
import { requestNotificationPermissions } from "../services/notifications";
import { auth } from "../services/firebase";
import { syncPendingSessions } from "../services/sessionStorage";

function AppShell() {
  const { theme } = useAppTheme();
  const [isOffline, setIsOffline] = useState(false);

  // Request notification permissions on app start
  useEffect(() => {
    requestNotificationPermissions().catch((error) => {
      console.error('Failed to request notification permissions:', error);
    });
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    // Check initial state
    NetInfo.fetch().then((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Retry pending session writes after sign-in, reconnect, and app resume.
  useEffect(() => {
    let userId: string | null = null;
    let appState = AppState.currentState;

    const sync = () => {
      if (!userId) return;
      syncPendingSessions(userId).catch((error) => {
        console.warn("Failed to sync pending sessions:", error);
      });
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      userId = user?.uid ?? null;
      sync();
    });
    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      if (state.isConnected) sync();
    });
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (appState !== "active" && nextState === "active") sync();
        appState = nextState;
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeNetwork();
      appStateSubscription.remove();
    };
  }, []);

  return (
    <PaperProvider theme={theme}>
      <ImageBackground
        source={require("../assets/bg.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <StatusBar style="dark" />
          
          {/* Offline warning banner */}
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineBannerText}>
                ⚠️ You are offline. Changes will sync when you reconnect.
              </Text>
            </View>
          )}

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

// Inner component that provides theme with user context
function ThemeAndUserProviders({ children }: { children: React.ReactNode }) {
  const { themePreference, saveThemePreference } = useUser();
  
  return (
    <ThemeProvider 
      initialPaletteName={themePreference}
      onPaletteChange={saveThemePreference}
    >
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UserProvider>
          <ThemeAndUserProviders>
            <TasksProvider>
              <AppShell />
            </TasksProvider>
          </ThemeAndUserProviders>
        </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  content:    { flex: 1 },
  offlineBanner: {
    backgroundColor: '#FFA500',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
