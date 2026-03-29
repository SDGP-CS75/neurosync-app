import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import RootLayout from "../../app/_layout";
import AuthLayout from "../../app/(auth)/_layout";
import ForgotPassword from "../../app/(auth)/forgotPassword";
import SignIn from "../../app/(auth)/signIn";
import SignUp from "../../app/(auth)/signUp";
import Welcome from "../../app/(auth)/welcome";
import Welcome2 from "../../app/(auth)/welcome2";
import Welcome3 from "../../app/(auth)/welcome3";
import DashboardIndex from "../../app/dashboard/index";
import DailyPlanScreen from "../../app/daily-plan";
import Index from "../../app/index";
import TemplatesScreen from "../../app/templates";
import TabsLayout from "../../app/(tabs)/_layout";
import AddTaskScreen from "../../app/(tabs)/add-task";
import CalendarScreen from "../../app/(tabs)/calendar";
import FocusTimer from "../../app/(tabs)/focus-timer";
import FocusTimerCounting from "../../app/(tabs)/focus-timer-counting";
import HomeScreen from "../../app/(tabs)/home";
import TabsIndex from "../../app/(tabs)/index";
import MoodAnalysis from "../../app/(tabs)/mood-analysis";
import MoodTracking from "../../app/(tabs)/mood-tracking";
import SessionHistory from "../../app/(tabs)/session-history";
import SettingsScreen from "../../app/(tabs)/settings";
import TodoListScreen from "../../app/(tabs)/todo-list";
import { mockSearchParams } from "../test-utils/mockAppContext";

jest.setTimeout(60000);

describe("screen coverage", () => {
  function renderAndUnmount(screens: React.ComponentType[]) {
    const renderedScreens = screens.map((Screen) => {
      let tree: TestRenderer.ReactTestRenderer | null = null;
      act(() => {
        tree = TestRenderer.create(<Screen />);
      });
      return tree;
    });

    renderedScreens.forEach((tree) => {
      if (!tree) return;
      act(() => {
        tree.unmount();
      });
    });
  }

  function renderSingle(Screen: React.ComponentType) {
    let tree: TestRenderer.ReactTestRenderer | null = null;
    act(() => {
      tree = TestRenderer.create(<Screen />);
    });
    if (!tree) return;
    act(() => {
      tree.unmount();
    });
  }

  beforeEach(() => {
    Object.assign(mockSearchParams, {
      mode: "focus",
      focusDuration: "1",
      breakDuration: "5",
      taskId: "",
      taskTitle: "",
      preselectedTaskId: "task-1",
    });
  });

  it("renders app shell and auth screens without crashing", () => {
    renderAndUnmount([
      RootLayout,
      AuthLayout,
      ForgotPassword,
      SignIn,
      SignUp,
      Welcome,
      Welcome2,
      Welcome3,
    ]);
  });

  it("renders top-level and productivity screens without crashing", () => {
    renderAndUnmount([
      DashboardIndex,
      DailyPlanScreen,
      Index,
      TemplatesScreen,
      TabsLayout,
      AddTaskScreen,
      CalendarScreen,
      FocusTimer,
      FocusTimerCounting,
      HomeScreen,
      TabsIndex,
    ]);
  });

  it("renders mood analysis without crashing", () => {
    renderSingle(MoodAnalysis);
  });

  it("renders mood tracking without crashing", () => {
    renderSingle(MoodTracking);
  });

  it("renders session history without crashing", () => {
    renderSingle(SessionHistory);
  });

  it("renders settings without crashing", () => {
    renderSingle(SettingsScreen);
  });

  it("renders todo list without crashing", () => {
    renderSingle(TodoListScreen);
  });
});
