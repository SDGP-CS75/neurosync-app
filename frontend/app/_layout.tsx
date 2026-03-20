/**
 * app/_layout.tsx  (root layout)
 *
 * Place ThemeContext.tsx in:  app/context/ThemeContext.tsx
 * Place theme.ts in:          app/constants/theme.ts
 */

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ImageBackground, StyleSheet, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider, useAppTheme } from "../context/ThemeContext";
import { UserProvider } from "../context/UserContext";
import { TasksProvider } from "../context/TasksContext";

// Inner component so it can read from ThemeContext
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
          </Stack>
        </View>
      </ImageBackground>
    </PaperProvider>
  );
}

// Root wraps everything in SafeAreaProvider + ThemeProvider + UserProvider + TasksProvider
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