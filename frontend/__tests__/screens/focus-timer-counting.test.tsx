import React from "react";
import { Text, View } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import FocusTimerCounting from "../../app/(tabs)/focus-timer-counting";

const mockBack = jest.fn();
const mockWriteSession = jest.fn();
const mockToggleSubtaskDone = jest.fn();
const mockLogFocusSession = jest.fn();

let mockParams: Record<string, string> = {};
let mockTasks: Array<{
  id: string;
  title: string;
  subtasks?: Array<{ id: string; text: string; isDone: boolean }>;
}> = [];

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
  }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock("../../context/ThemeContext", () => ({
  useAppTheme: () => ({
    theme: {
      colors: {
        background: "#ffffff",
        surface: "#f3f4f6",
        primary: "#2563eb",
        secondary: "#14b8a6",
        onBackground: "#111827",
        onSurface: "#111827",
        onSurfaceVariant: "#6b7280",
        outline: "#cbd5e1",
        error: "#ef4444",
      },
    },
  }),
}));

jest.mock("../../context/TasksContext", () => ({
  useTasks: () => ({
    tasks: mockTasks,
    toggleSubtaskDone: mockToggleSubtaskDone,
    logFocusSession: mockLogFocusSession,
    userId: "user-123",
  }),
}));

jest.mock("../../components/Nav", () => () => null);

jest.mock("../../components/BreakActivityModal", () => ({
  __esModule: true,
  default: ({
    visible,
    sessionDurationMinutes,
  }: {
    visible: boolean;
    sessionDurationMinutes: number;
  }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return visible
      ? React.createElement(
          Text,
          null,
          `Break activity modal for ${sessionDurationMinutes} minutes`
        )
      : null;
  },
}));

jest.mock("../../services/sessionStorage", () => ({
  writeSession: (...args: unknown[]) => mockWriteSession(...args),
}));

jest.mock("expo-audio", () => ({
  createAudioPlayer: jest.fn(() => ({
    loop: false,
    volume: 1,
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    remove: jest.fn(),
  })),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, name);
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => {
    const React = require("react");
    const { View } = require("react-native");

    return React.createElement(View, null, children);
  },
}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    __esModule: true,
    default: View,
    Circle: View,
  };
});

describe("FocusTimerCounting", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockParams = {
      mode: "focus",
      focusDuration: "1",
      breakDuration: "5",
      taskId: "",
      taskTitle: "",
    };
    mockTasks = [];
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("counts down while running and resets back to the full duration", () => {
    render(<FocusTimerCounting />);

    expect(screen.getByText("01:00")).toBeTruthy();
    expect(screen.getByText("Running")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText("00:58")).toBeTruthy();

    fireEvent.press(screen.getByText("Reset"));

    expect(screen.getByText("01:00")).toBeTruthy();
    expect(screen.getByText("Paused")).toBeTruthy();
  });

  it("opens the break activity modal when skipping a free-focus session", () => {
    render(<FocusTimerCounting />);

    fireEvent.press(screen.getByText("Skip"));

    expect(
      screen.getByText("Break activity modal for 0 minutes")
    ).toBeTruthy();
  });
});
