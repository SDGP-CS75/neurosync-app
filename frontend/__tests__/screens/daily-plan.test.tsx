import React from "react";
import { act } from "react-test-renderer";
import TestRenderer from "react-test-renderer";

import DailyPlanScreen from "../../app/daily-plan";
import { apiRequest } from "../../services/apiClient";
import {
  mockTasksContext,
  sampleTask,
} from "../test-utils/mockAppContext";

jest.mock("../../services/apiClient", () => ({
  apiRequest: jest.fn(),
}));

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe("daily plan request lifecycle", () => {
  beforeEach(() => {
    mockedApiRequest.mockResolvedValue({
      orderedTaskIds: [sampleTask.id],
      reasoning: { [sampleTask.id]: "Due today" },
    });
  });

  it("does not refetch for sync-only task changes", async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<DailyPlanScreen />);
      await Promise.resolve();
    });

    expect(mockedApiRequest).toHaveBeenCalledTimes(1);

    const syncedTask = {
      ...sampleTask,
      isSynced: false,
      updatedAt: "2026-10-28T10:00:00.000Z",
    };
    mockTasksContext.tasks = [syncedTask];

    await act(async () => {
      tree!.update(<DailyPlanScreen />);
      await Promise.resolve();
    });

    expect(mockedApiRequest).toHaveBeenCalledTimes(1);

    const editedTask = {
      ...sampleTask,
      title: "Write the final report",
      isSynced: false,
    };
    mockTasksContext.tasks = [editedTask];

    await act(async () => {
      tree!.update(<DailyPlanScreen />);
      await Promise.resolve();
    });

    expect(mockedApiRequest).toHaveBeenCalledTimes(2);

    act(() => {
      tree!.unmount();
    });
  });
});
