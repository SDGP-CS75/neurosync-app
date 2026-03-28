import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";

import AddTaskModal from "../../components/AddTaskModal";
import BottomNavBar from "../../components/BottomNavBar";
import BreakActivityModal from "../../components/BreakActivityModal";
import DependencyBadge from "../../components/DependencyBadge";
import InProgressCard from "../../components/InProgressCard";
import InputDialog from "../../components/InputDialog";
import Nav from "../../components/Nav";
import SectionTitle from "../../components/SectionTitle";
import SparkleLoader from "../../components/SparkleLoader";
import SubtaskNoteModal from "../../components/SubtaskNoteModal";
import TaskGroupCard from "../../components/TaskGroupCard";
import TaskPicker from "../../components/TaskPicker";
import ThemePicker from "../../components/ThemePicker";
import UndoSnackbar from "../../components/UndoSnackbar";
import { mockTasksContext } from "../test-utils/mockAppContext";

describe("component coverage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("renders all shared components without crashing", () => {
    mockTasksContext.lastDeleted = {
      id: "deleted-1",
      title: "Deleted task",
    } as never;

    const saveTask = jest.fn();

    const components = [
      render(<AddTaskModal visible onClose={jest.fn()} onSave={saveTask} />),
      render(<BottomNavBar />),
      render(
        <BreakActivityModal
          visible
          onClose={jest.fn()}
          sessionDurationMinutes={10}
        />
      ),
      render(
        <DependencyBadge
          blockedByTexts={["Complete draft", "Review notes"]}
          visible
        />
      ),
      render(
        <InProgressCard
          title="Office Project"
          subtitle="Finish weekly report"
          icon={<Text>icon</Text>}
          bgColor="bg-white"
          progress={0.6}
          progressColor="#2563eb"
        />
      ),
      render(
        <InputDialog
          visible
          hideDialog={jest.fn()}
          title="Rename task"
          placeholder="Task name"
          onSubmit={jest.fn()}
          initialValue="Old name"
        />
      ),
      render(<Nav />),
      render(<SectionTitle title="Tasks" count={2} />),
      render(<SparkleLoader />),
      render(
        <SubtaskNoteModal
          visible
          onClose={jest.fn()}
          initialNote="Remember this"
          onSave={jest.fn()}
          subtaskText="Draft outline"
        />
      ),
      render(
        <TaskGroupCard
          title="Personal"
          tasks={3}
          progress={45}
          icon={<Text>icon</Text>}
          iconBgColor="bg-blue-100"
        />
      ),
      render(<TaskPicker visible onClose={jest.fn()} onSelect={jest.fn()} />),
      render(<ThemePicker />),
      render(<UndoSnackbar />),
    ];

    expect(components[11].toJSON()).toBeTruthy();
    expect(components[13].getByText("Undo")).toBeTruthy();
  });
});
