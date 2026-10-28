import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export default class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled application render error", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="warning-outline" size={36} color="#B45309" />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Something went wrong
        </Text>
        <Text style={styles.message}>
          NeuroSync hit an unexpected error. Your saved data is still safe.
        </Text>
        {__DEV__ ? (
          <Text style={styles.details} numberOfLines={5}>
            {this.state.error.message}
          </Text>
        ) : null}
        <Pressable
          onPress={this.handleRetry}
          accessibilityRole="button"
          accessibilityLabel="Try loading the app again"
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
          ]}
        >
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#FFF8ED",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    marginBottom: 20,
  },
  title: {
    color: "#292524",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    maxWidth: 420,
    marginTop: 10,
    color: "#57534E",
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
  },
  details: {
    maxWidth: 420,
    marginTop: 16,
    color: "#78716C",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  retryButton: {
    minWidth: 132,
    minHeight: 48,
    marginTop: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  retryButtonPressed: {
    opacity: 0.82,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
