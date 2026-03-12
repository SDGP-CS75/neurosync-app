import React from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";

export default function HomeScreen() {
  const { theme } = useAppTheme();

  return (
    <LinearGradient
      colors={["#fef6e4", "#f0e6ff", "#e6f0ff", "#e6fff0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: theme.colors.onSurface }}>Home Screen</Text>
          
          {/* Bottom spacing for nav */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
      <Nav />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
});