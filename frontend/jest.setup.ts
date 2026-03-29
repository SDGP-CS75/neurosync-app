import { jest } from "@jest/globals";
import "react-native-gesture-handler/jestSetup";
import { resetMockAppState } from "./__tests__/test-utils/mockAppContext";

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");

  Reanimated.default.call = () => {};

  return Reanimated;
});

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");
  const {
    mockRouter,
    mockSearchParams,
  } = require("./__tests__/test-utils/mockAppContext");

  const Slot = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);

  const Stack = Object.assign(
    ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    { Screen: () => null }
  );

  const Tabs = Object.assign(
    ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    { Screen: () => null }
  );

  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => mockSearchParams,
    usePathname: () => "/",
    useSegments: () => [],
    Redirect: () => null,
    Link: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    Slot,
    Stack,
    Tabs,
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const Icon = ({ name }: { name?: string }) =>
    React.createElement(Text, null, name ?? "icon");

  return {
    Ionicons: Icon,
    MaterialCommunityIcons: Icon,
    MaterialIcons: Icon,
    FontAwesome5: Icon,
  };
});

jest.mock("@expo/vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return ({ name }: { name?: string }) =>
    React.createElement(Text, null, name ?? "icon");
});

jest.mock("@expo/vector-icons/FontAwesome5", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return ({ name }: { name?: string }) =>
    React.createElement(Text, null, name ?? "icon");
});

jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return ({ name }: { name?: string }) =>
    React.createElement(Text, null, name ?? "icon");
});

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    SafeAreaProvider: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    SafeAreaView: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock("react-native-paper", () => {
  const React = require("react");
  const { TextInput: RNTextInput, TouchableOpacity, Text, View } = require("react-native");
  const { mockTheme } = require("./__tests__/test-utils/mockAppContext");

  const Dialog = Object.assign(
    ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    {
      Title: ({ children }: { children?: React.ReactNode }) =>
        React.createElement(Text, null, children),
      Content: ({ children }: { children?: React.ReactNode }) =>
        React.createElement(View, null, children),
      Actions: ({ children }: { children?: React.ReactNode }) =>
        React.createElement(View, null, children),
    }
  );

  return {
    MD3LightTheme: { colors: {} },
    PaperProvider: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    Portal: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    Dialog,
    Button: ({
      children,
      onPress,
      disabled,
    }: {
      children?: React.ReactNode;
      onPress?: () => void;
      disabled?: boolean;
    }) =>
      React.createElement(
        TouchableOpacity,
        { onPress, disabled },
        React.createElement(Text, null, children)
      ),
    TextInput: ({
      value,
      onChangeText,
      placeholder,
    }: {
      value?: string;
      onChangeText?: (text: string) => void;
      placeholder?: string;
    }) =>
      React.createElement(RNTextInput, {
        value,
        onChangeText,
        placeholder,
      }),
    HelperText: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(Text, null, children),
    Text: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(Text, null, children),
    useTheme: () => mockTheme,
  };
});

jest.mock("./context/ThemeContext", () => {
  const {
    mockTheme,
  } = require("./__tests__/test-utils/mockAppContext");

  return {
    ThemeProvider: ({ children }: { children?: React.ReactNode }) => children,
    useAppTheme: () => ({
      theme: mockTheme,
      palette: { name: "Violet" },
      allPalettes: [],
      setPalette: jest.fn(),
    }),
  };
});

jest.mock("./context/TasksContext", () => {
  const { mockTasksContext } = require("./__tests__/test-utils/mockAppContext");

  return {
    TasksProvider: ({ children }: { children?: React.ReactNode }) => children,
    useTasks: () => mockTasksContext,
  };
});

jest.mock("./context/UserContext", () => {
  const { mockUserContext } = require("./__tests__/test-utils/mockAppContext");

  return {
    UserProvider: ({ children }: { children?: React.ReactNode }) => children,
    useUser: () => mockUserContext,
  };
});

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({ app: true })),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  initializeAuth: jest.fn(() => ({ currentUser: null })),
  getReactNativePersistence: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn((_auth: unknown, callback: (user: null) => void) => {
    callback(null);
    return jest.fn();
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  arrayUnion: jest.fn((value: unknown) => ({ __arrayUnion: value })),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) } as never),
  getDocs: jest.fn().mockResolvedValue({ docs: [], forEach: jest.fn() } as never),
  getFirestore: jest.fn(() => ({ db: true })),
  orderBy: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
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
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined as never),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null as never),
    setItem: jest.fn().mockResolvedValue(undefined as never),
    removeItem: jest.fn().mockResolvedValue(undefined as never),
  },
}));

jest.mock("expo-av", () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          unloadAsync: jest.fn(),
        },
      } as never),
    },
  },
}));

jest.mock("expo-blur", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { BlurView: ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children) };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { LinearGradient: ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children) };
});

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true } as never),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true } as never),
  MediaTypeOptions: { Images: "Images" },
}));

jest.mock("expo-auth-session/providers/google", () => ({
  useAuthRequest: jest.fn(() => [{}, null, jest.fn()]),
}));

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({
    status: "granted",
    canAskAgain: true,
  } as never),
  requestPermissionsAsync: jest.fn().mockResolvedValue({
    status: "granted",
    canAskAgain: true,
  } as never),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined as never),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notification-id" as never),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined as never),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined as never),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([] as never),
  AndroidImportance: {
    HIGH: "high",
  },
  AndroidNotificationPriority: {
    HIGH: "high",
    LOW: "low",
    DEFAULT: "default",
  },
  SchedulableTriggerInputTypes: {
    DATE: "date",
  },
}), { virtual: true });

jest.mock("expo-device", () => ({
  isDevice: true,
}), { virtual: true });

jest.mock("expo-speech-recognition", () => ({
  useSpeechRecognitionEvent: jest.fn(),
  startSpeechRecognitionAsync: jest.fn(),
  stopSpeechRecognitionAsync: jest.fn(),
}), { virtual: true });

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn((callback: (state: { isConnected: boolean; isInternetReachable: boolean }) => void) => {
      callback({ isConnected: true, isInternetReachable: true });
      return jest.fn();
    }),
    fetch: jest.fn().mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as never),
  },
}));

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const { View } = require("react-native");
  return ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children);
});

jest.mock("@react-native-community/slider", () => {
  const React = require("react");
  const { View } = require("react-native");
  return ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children);
});

jest.mock("react-native-chart-kit", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LineChart: () => React.createElement(View, null),
    BarChart: () => React.createElement(View, null),
    PieChart: () => React.createElement(View, null),
  };
});

jest.mock("react-native-circular-progress", () => ({
  AnimatedCircularProgress: ({ children }: { children?: (fill: number) => React.ReactNode }) =>
    (children ? children(0) : null),
}));

jest.mock("react-native-circular-progress-indicator", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => React.createElement(View, null);
});

jest.mock("react-native-progress", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    Bar: () => React.createElement(View, null),
  };
});

jest.mock("react-native-draggable-flatlist", () => {
  const React = require("react");
  const { FlatList } = require("react-native");
  return ({ data, renderItem }: { data: unknown[]; renderItem: ({ item, index }: { item: unknown; index: number }) => React.ReactNode }) =>
    React.createElement(FlatList, {
      data,
      renderItem,
      keyExtractor: (_item: unknown, index: number) => String(index),
    });
});

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    __esModule: true,
    default: View,
    Circle: View,
    Path: View,
    Rect: View,
    G: View,
  };
});

jest.mock("lottie-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => React.createElement(View, null);
});

jest.mock("lucide-react-native", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return new Proxy(
    {},
    {
      get: () => () => React.createElement(Text, null, "icon"),
    }
  );
});

beforeEach(() => {
  resetMockAppState();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});
