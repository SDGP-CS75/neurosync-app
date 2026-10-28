import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "firebase/auth";
import { getDocs } from "firebase/firestore";

import { resetAllData } from "../../services/reset";

describe("data reset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuth as jest.Mock).mockReturnValue({
      currentUser: { uid: "user-1" },
    });
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
  });

  it("clears only the signed-in user's local caches", async () => {
    await expect(resetAllData()).resolves.toEqual({ success: true });

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      "@neurosync_tasks_user-1",
      "@neurosync_task_tombstones_user-1",
    ]);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      "@neurosync_sessions_user-1"
    );
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      "@neurosync_mood_entries_user-1"
    );
    expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith(
      "@neurosync_sessions_other-user"
    );
    expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith(
      "@neurosync_mood_entries_other-user"
    );
  });
});
