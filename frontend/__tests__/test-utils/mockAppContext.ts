export const mockTheme = {
  colors: {
    primary: "#2563eb",
    secondary: "#14b8a6",
    background: "#ffffff",
    surface: "#f3f4f6",
    surfaceVariant: "#e5e7eb",
    onBackground: "#111827",
    onSurface: "#111827",
    onSurfaceVariant: "#6b7280",
    text: "#111827",
    textMuted: "#6b7280",
    outline: "#cbd5e1",
    error: "#ef4444",
    navBar: "#ffffff",
    brand: "#2563eb",
    statusDone: "#dcfce7",
    statusInProgress: "#fef3c7",
    statusTodo: "#dbeafe",
  },
};

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  dismiss: jest.fn(),
  canGoBack: jest.fn(() => true),
};

export let mockSearchParams: Record<string, string> = {};

export const sampleTask = {
  id: "task-1",
  category: "Work",
  title: "Write report",
  status: "todo" as const,
  icon: "📝",
  iconBg: "#dbeafe",
  dateKey: "2026-03-26",
  isSynced: true,
  subtasks: [
    {
      id: "subtask-1",
      text: "Draft outline",
      isAdding: false,
      isGenarated: false,
      isDone: false,
      order: 0,
      durationMinutes: 15,
    },
  ],
};

export const mockTasksContext = {
  tasks: [sampleTask],
  addTask: jest.fn(),
  updateTask: jest.fn(),
  removeTask: jest.fn(),
  toggleSubtaskDone: jest.fn(),
  toggleTaskStatus: jest.fn(),
  reorderSubtasks: jest.fn(),
  addSubtaskNote: jest.fn(),
  logFocusSession: jest.fn(),
  undoDelete: jest.fn(),
  isLoading: false,
  userId: "user-123",
  lastDeleted: null,
};

export const mockUserContext = {
  profile: {
    name: "Taylor User",
    email: "taylor@example.com",
    age: "25",
    about: "Testing profile",
    profileImage: "",
    themeName: "Violet",
  },
  updateProfile: jest.fn(),
  setProfileImage: jest.fn(),
  resetProfile: jest.fn(),
  isLoading: false,
  saveThemePreference: jest.fn().mockResolvedValue(undefined),
  themePreference: "Violet",
};

export function resetMockAppState() {
  mockSearchParams = {};
  Object.values(mockRouter).forEach((value) => {
    if (typeof value === "function" && "mockClear" in value) {
      (value as jest.Mock).mockClear();
    }
  });

  mockTasksContext.tasks = [sampleTask];
  mockTasksContext.lastDeleted = null;
  Object.entries(mockTasksContext).forEach(([, value]) => {
    if (typeof value === "function" && "mockClear" in value) {
      (value as jest.Mock).mockClear();
    }
  });

  Object.values(mockUserContext).forEach((value) => {
    if (typeof value === "function" && "mockClear" in value) {
      (value as jest.Mock).mockClear();
    }
  });
}
