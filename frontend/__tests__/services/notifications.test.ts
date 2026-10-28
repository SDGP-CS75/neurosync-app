import * as Notifications from "expo-notifications";

import {
  presentTaskCompletionNotification,
  scheduleRecurringNotification,
  scheduleTaskNotification,
} from "../../services/notifications";

describe("notification service", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-28T09:00:00.000Z"));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("caps recurring reminders below platform pending limits", async () => {
    const result = await scheduleRecurringNotification(
      {
        id: "task-1",
        title: "Daily review",
        dueDate: "2026-10-29T09:00:00.000Z",
        reminder: "0",
      },
      {
        frequency: "daily",
        interval: 1,
        maxOccurrences: 365,
      }
    );

    expect(result).toHaveLength(30);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(30);
  });

  it("honours the no-sound option", async () => {
    await scheduleTaskNotification(
      {
        id: "task-2",
        title: "Quiet reminder",
        dueDate: "2026-10-29T09:00:00.000Z",
        reminder: "0",
      },
      { sound: "none" }
    );

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ sound: false }),
      })
    );
  });

  it("presents focus completion immediately", async () => {
    await presentTaskCompletionNotification("Write report");

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "Focus session complete",
          body: expect.stringContaining("Write report"),
        }),
        trigger: null,
      })
    );
  });
});
