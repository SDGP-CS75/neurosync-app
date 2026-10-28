import React from "react";
import { render } from "@testing-library/react-native";

import BreakActivityModal from "../../components/BreakActivityModal";
import DependencyBadge from "../../components/DependencyBadge";
import InputDialog from "../../components/InputDialog";
import Nav from "../../components/Nav";
import SparkleLoader from "../../components/SparkleLoader";
import SubtaskNoteModal from "../../components/SubtaskNoteModal";
import TaskPicker from "../../components/TaskPicker";
import ThemePicker from "../../components/ThemePicker";
import UndoSnackbar from "../../components/UndoSnackbar";
import { mockTasksContext } from "../test-utils/mockAppContext";

jest.setTimeout(30000);

describe("component coverage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  function renderAndUnmount(components: Array<ReturnType<typeof render>>) {
    components.forEach((component) => component.unmount());
  }

  it("renders modal components without crashing", () => {
    mockTasksContext.lastDeleted = {
      id: "deleted-1",
      title: "Deleted task",
    } as never;

    const components = [
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
        <InputDialog
          visible
          hideDialog={jest.fn()}
          title="Rename task"
          placeholder="Task name"
          onSubmit={jest.fn()}
          initialValue="Old name"
        />
      ),
      render(
        <SubtaskNoteModal
          visible
          onClose={jest.fn()}
          initialNote="Remember this"
          onSave={jest.fn()}
          subtaskText="Draft outline"
        />
      ),
      render(<TaskPicker visible onClose={jest.fn()} onSelect={jest.fn()} />),
    ];

    expect(components[0].toJSON()).toBeTruthy();
    expect(components[1].toJSON()).toBeTruthy();

    renderAndUnmount(components);
  });

  it("renders shared display components without crashing", () => {
    const components = [
      render(
        <DependencyBadge
          blockedByTexts={["Complete draft", "Review notes"]}
          visible
        />
      ),
      render(<Nav />),
      render(<SparkleLoader />),
    ];

    expect(components[1].toJSON()).toBeTruthy();
    expect(components[2].toJSON()).toBeTruthy();

    renderAndUnmount(components);
  });

  it("renders context-driven utility components without crashing", () => {
    mockTasksContext.lastDeleted = {
      id: "deleted-1",
      title: "Deleted task",
    } as never;

    const components = [
      render(<ThemePicker />),
      render(<UndoSnackbar />),
    ];

    expect(components[0].toJSON()).toBeTruthy();
    expect(components[1].getByText("Undo")).toBeTruthy();

    renderAndUnmount(components);
  });
});
