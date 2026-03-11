import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Dimensions,
  ScrollView,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Audio } from "expo-av";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.7, 280);
const SCREEN_SAVER_TIMEOUT = 10000; // 10 seconds

type MusicStream = {
  id: string;
  name: string;
  url: string;
  icon: keyof typeof Ionicons.glyphMap;
};

// Music categories with streams
const MUSIC_CATEGORIES: {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  streams: MusicStream[];
}[] = [
  {
    id: "focus",
    name: "Focus Music",
    icon: "bulb",
    streams: [
      { 
        id: "lofi", 
        name: "Lo-Fi Beats", 
        url: "https://streams.ilovemusic.de/iloveradio17.mp3",
        icon: "musical-notes"
      },
      { 
        id: "piano", 
        name: "Piano Chill", 
        url: "https://streams.ilovemusic.de/iloveradio10.mp3",
        icon: "musical-note"
      },
    ]
  },
  {
    id: "ambient",
    name: "Ambient & Nature",
    icon: "leaf",
    streams: [
      { 
        id: "ambient", 
        name: "Ambient", 
        url: "https://streams.ilovemusic.de/iloveradio19.mp3",
        icon: "cloudy-night"
      },
      { 
        id: "rain", 
        name: "Rain Sounds", 
        url: "https://rainymood.com/audio1112/0.m4a",
        icon: "rainy"
      },
    ]
  },
  {
    id: "chill",
    name: "Chill & Relaxation",
    icon: "cafe",
    streams: [
      { 
        id: "chillout", 
        name: "Chillout", 
        url: "https://streams.ilovemusic.de/iloveradio7.mp3",
        icon: "heart"
      },
      { 
        id: "jazz", 
        name: "Smooth Jazz", 
        url: "https://streams.ilovemusic.de/iloveradio14.mp3",
        icon: "wine"
      },
    ]
  },
];

// Flatten streams for easy access
const ALL_STREAMS: MusicStream[] = MUSIC_CATEGORIES.flatMap(cat => cat.streams);

type TimerMode = "focus" | "break";

export default function FocusTimerCounting() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get initial values from params or use defaults
  const initialMode = (params.mode as TimerMode) || "focus";
  const initialFocusDuration = params.focusDuration ? Number(params.focusDuration) : 25;
  const initialBreakDuration = params.breakDuration ? Number(params.breakDuration) : 5;

  // Timer state
  const [mode, setMode] = useState<TimerMode>(initialMode);
  const [focusDuration, setFocusDuration] = useState(initialFocusDuration);
  const [breakDuration, setBreakDuration] = useState(initialBreakDuration);
  const [timeLeft, setTimeLeft] = useState(
    initialMode === "focus" ? initialFocusDuration * 60 : initialBreakDuration * 60
  );
  const [isRunning, setIsRunning] = useState(true); // Start running immediately
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showLoading, setShowLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  
  // Music state
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [selectedStream, setSelectedStream] = useState<MusicStream>(ALL_STREAMS[0]);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Screen saver state
  const [showScreenSaver, setShowScreenSaver] = useState(false);
  const screenSaverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenSaverAnim = useRef(new Animated.Value(0)).current;

  // Animation
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  // Reset screen saver timeout on any touch
  const resetScreenSaverTimeout = useCallback(() => {
    if (screenSaverTimeout.current) {
      clearTimeout(screenSaverTimeout.current);
    }
    
    if (showScreenSaver) {
      // Hide screen saver with animation
      Animated.timing(screenSaverAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowScreenSaver(false));
    }
    
    // Only set timeout if timer is running
    if (isRunning) {
      screenSaverTimeout.current = setTimeout(() => {
        setShowScreenSaver(true);
        Animated.timing(screenSaverAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, SCREEN_SAVER_TIMEOUT);
    }
  }, [showScreenSaver, isRunning, screenSaverAnim]);

  // Start/stop screen saver timeout based on timer running state
  useEffect(() => {
    if (isRunning) {
      resetScreenSaverTimeout();
    } else {
      if (screenSaverTimeout.current) {
        clearTimeout(screenSaverTimeout.current);
      }
      if (showScreenSaver) {
        Animated.timing(screenSaverAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowScreenSaver(false));
      }
    }
    
    return () => {
      if (screenSaverTimeout.current) {
        clearTimeout(screenSaverTimeout.current);
      }
    };
  }, [isRunning]);

  // Setup audio mode on mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.log("Error setting audio mode:", error);
      }
    };
    setupAudio();

    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Toggle music - plays ambient/lo-fi music for focus
  const toggleMusic = async () => {
    if (isMusicOn) {
      // Stop the music
      await stopMusic();
    } else {
      // Show music picker to select a stream
      setShowMusicPicker(true);
    }
  };

  // Stop music playback
  const stopMusic = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsMusicOn(false);
    } catch (error) {
      console.log("Error stopping music:", error);
    }
  };

  // Play selected music stream
  const playMusicStream = async (stream: MusicStream) => {
    try {
      // Stop any currently playing music
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setSelectedStream(stream);
      setShowMusicPicker(false);
      setIsMusicLoading(true);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: stream.url },
        { 
          shouldPlay: true, 
          isLooping: true,
          volume: 0.5,
        }
      );
      
      soundRef.current = sound;
      setIsMusicOn(true);
      setIsMusicLoading(false);

      // Handle playback status updates
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying && !status.didJustFinish) {
          // Sound was stopped externally
        }
      });
    } catch (error) {
      console.log("Error playing music:", error);
      setIsMusicLoading(false);
      setIsMusicOn(false);
    }
  };

  // Pause/resume music when timer pauses/resumes
  useEffect(() => {
    const handleMusicWithTimer = async () => {
      if (soundRef.current && isMusicOn) {
        try {
          if (isRunning) {
            await soundRef.current.playAsync();
          } else {
            await soundRef.current.pauseAsync();
          }
        } catch (error) {
          console.log("Error handling music with timer:", error);
        }
      }
    };
    handleMusicWithTimer();
  }, [isRunning, isMusicOn]);

  // Get total duration based on mode
  const getTotalDuration = useCallback(() => {
    return (mode === "focus" ? focusDuration : breakDuration) * 60;
  }, [mode, focusDuration, breakDuration]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress (0 to 1)
  const getProgress = useCallback(() => {
    const total = getTotalDuration();
    return timeLeft / total;
  }, [timeLeft, getTotalDuration]);

  // Update progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: getProgress(),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, progressAnim, getProgress]);

  // Pulse animation when running
  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning, pulseAnim]);

  // Loading animation
  useEffect(() => {
    if (showLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(loadingAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      loadingAnim.setValue(0);
    }
  }, [showLoading, loadingAnim]);

  // Timer countdown logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Timer completed - show loading screen
      Vibration.vibrate([0, 500, 200, 500]);
      setIsRunning(false);
      
      if (mode === "focus") {
        setSessionsCompleted((prev) => prev + 1);
        setLoadingMessage("Great focus session! 🎉\nPreparing your break...");
        setShowLoading(true);
        
        // Transition to break after loading
        setTimeout(() => {
          setShowLoading(false);
          setMode("break");
          setTimeLeft(breakDuration * 60);
          setIsRunning(true);
        }, 3000);
      } else {
        setLoadingMessage("Break complete! 💪\nReady for another focus session?");
        setShowLoading(true);
        
        // Transition to focus after loading
        setTimeout(() => {
          setShowLoading(false);
          setMode("focus");
          setTimeLeft(focusDuration * 60);
          // Don't auto-start focus mode, let user decide
        }, 3000);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, focusDuration, breakDuration]);

  // Control functions
  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getTotalDuration());
  };

  const handleSkip = () => {
    setIsRunning(false);
    setLoadingMessage(mode === "focus" ? "Skipping to break..." : "Skipping to focus...");
    setShowLoading(true);
    
    setTimeout(() => {
      setShowLoading(false);
      if (mode === "focus") {
        setMode("break");
        setTimeLeft(breakDuration * 60);
      } else {
        setMode("focus");
        setTimeLeft(focusDuration * 60);
      }
    }, 1500);
  };

  const handleStop = async () => {
    setIsRunning(false);
    // Stop and cleanup music before leaving
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        console.log("Error stopping music:", error);
      }
    }
    router.back();
  };

  // Progress circle interpolation
  const progressInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const loadingScale = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const styles = createStyles(theme, mode);

  return (
    <TouchableWithoutFeedback onPress={resetScreenSaverTimeout}>
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={showScreenSaver} />
        
        {/* Screen Saver Modal */}
        <Modal
          visible={showScreenSaver}
          transparent
          animationType="none"
        >
          <TouchableWithoutFeedback onPress={resetScreenSaverTimeout}>
            <Animated.View 
              style={[
                styles.screenSaverContainer,
                { opacity: screenSaverAnim }
              ]}
            >
              <View style={styles.screenSaverContent}>
                <Text style={styles.screenSaverTime}>{formatTime(timeLeft)}</Text>
~                
                {/* Progress Bar */}
                <View style={styles.screenSaverProgressContainer}>
                  <View style={styles.screenSaverProgressBackground}>
                    <Animated.View 
                      style={[
                        styles.screenSaverProgressFill,
                        { 
                          width: `${(1 - getProgress()) * 100}%`,
                          backgroundColor: mode === "focus" ? theme.colors.primary : theme.colors.secondary,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.screenSaverProgressText}>
                    {Math.round((1 - getProgress()) * 100)}% complete
                  </Text>
                </View>
                
                <Text style={styles.screenSaverHint}>Tap anywhere to exit</Text>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Loading Modal */}
        <Modal
          visible={showLoading}
          transparent
          animationType="fade"
        >
        <View style={styles.loadingOverlay}>
          <Animated.View 
            style={[
              styles.loadingContainer,
              { transform: [{ scale: loadingScale }] }
            ]}
          >
            <View style={styles.loadingIconContainer}>
              <Ionicons 
                name={mode === "focus" ? "cafe-outline" : "bulb-outline"} 
                size={48} 
                color={theme.colors.primary} 
              />
            </View>
            <ActivityIndicator 
              size="large" 
              color={theme.colors.primary} 
              style={styles.spinner}
            />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
            <View style={styles.loadingDots}>
              <Animated.View style={[styles.dot, { opacity: loadingAnim }]} />
              <Animated.View style={[styles.dot, { opacity: loadingAnim }]} />
              <Animated.View style={[styles.dot, { opacity: loadingAnim }]} />
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Music Picker Modal */}
      <Modal
        visible={showMusicPicker}
        transparent
        animationType="slide"
      >
        <View style={styles.musicPickerOverlay}>
          <View style={styles.musicPickerContainer}>
            <View style={styles.musicPickerHeader}>
              <Text style={styles.musicPickerTitle}>Choose Music</Text>
              <TouchableOpacity 
                onPress={() => setShowMusicPicker(false)}
                style={styles.musicPickerClose}
              >
                <Ionicons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.musicPickerScroll} showsVerticalScrollIndicator={false}>
              {/* No Music Option */}
              <TouchableOpacity
                style={[
                  styles.musicPickerItem,
                  !isMusicOn && styles.musicPickerItemActive
                ]}
                onPress={async () => {
                  await stopMusic();
                  setShowMusicPicker(false);
                }}
              >
                <View style={[
                  styles.musicPickerIcon,
                  !isMusicOn && styles.musicPickerIconActive
                ]}>
                  <Ionicons 
                    name="volume-mute" 
                    size={24} 
                    color={!isMusicOn ? "#fff" : theme.colors.onSurfaceVariant} 
                  />
                </View>
                <Text style={[
                  styles.musicPickerItemText,
                  !isMusicOn && styles.musicPickerItemTextActive
                ]}>
                  No Music
                </Text>
                {!isMusicOn && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>

              {/* Music Categories */}
              {MUSIC_CATEGORIES.map((category) => (
                <View key={category.id} style={styles.musicCategory}>
                  <View style={styles.musicCategoryHeader}>
                    <Ionicons name={category.icon} size={18} color={theme.colors.primary} />
                    <Text style={styles.musicCategoryTitle}>{category.name}</Text>
                  </View>
                  
                  {category.streams.map((stream) => (
                    <TouchableOpacity
                      key={stream.id}
                      style={[
                        styles.musicPickerItem,
                        selectedStream.id === stream.id && isMusicOn && styles.musicPickerItemActive
                      ]}
                      onPress={() => playMusicStream(stream as MusicStream)}
                    >
                      <View style={[
                        styles.musicPickerIcon,
                        selectedStream.id === stream.id && isMusicOn && styles.musicPickerIconActive
                      ]}>
                        <Ionicons 
                          name={stream.icon} 
                          size={24} 
                          color={selectedStream.id === stream.id && isMusicOn ? "#fff" : theme.colors.primary} 
                        />
                      </View>
                      <Text style={[
                        styles.musicPickerItemText,
                        selectedStream.id === stream.id && isMusicOn && styles.musicPickerItemTextActive
                      ]}>
                        {stream.name}
                      </Text>
                      {selectedStream.id === stream.id && isMusicOn && (
                        <Ionicons name="volume-high" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>

            <Text style={styles.musicPickerHint}>
              🎵 Music will play in the background while you focus
            </Text>
          </View>
        </View>
      </Modal>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleStop} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {mode === "focus" ? "Focus Mode" : "Break Time"}
          </Text>
          <View style={styles.sessionBadge}>
            <Ionicons name="flame" size={16} color={theme.colors.primary} />
            <Text style={styles.sessionText}>{sessionsCompleted}</Text>
          </View>
        </View>

        {/* Mode Indicator */}
        <View style={styles.modeIndicator}>
          <View style={[styles.modeIcon, mode === "focus" && styles.modeIconActive]}>
            <Ionicons 
              name="bulb" 
              size={20} 
              color={mode === "focus" ? "#fff" : theme.colors.onSurfaceVariant} 
            />
          </View>
          <View style={styles.modeLine} />
          <View style={[styles.modeIcon, mode === "break" && styles.modeIconActive]}>
            <Ionicons 
              name="cafe" 
              size={20} 
              color={mode === "break" ? "#fff" : theme.colors.onSurfaceVariant} 
            />
          </View>
        </View>

        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <Animated.View
            style={[
              styles.timerCircle,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            {/* Progress Ring */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground} />
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    transform: [{ rotate: progressInterpolate }],
                  },
                ]}
              />
              <View style={styles.progressCover} />
            </View>

            {/* Timer Content */}
            <View style={styles.timerContent}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              <Text style={styles.timerLabel}>
                {mode === "focus" ? "Stay focused!" : "Take a break"}
              </Text>
              
              {/* Status indicator */}
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, isRunning && styles.statusDotActive]} />
                <Text style={styles.statusText}>
                  {isRunning ? "Running" : "Paused"}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
            <Ionicons name="refresh" size={24} color={theme.colors.onSurface} />
            <Text style={styles.buttonLabel}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={handleStartPause}>
            <Ionicons
              name={isRunning ? "pause" : "play"}
              size={32}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
            <Ionicons name="play-skip-forward" size={24} color={theme.colors.onSurface} />
            <Text style={styles.buttonLabel}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Music Button */}
        <TouchableOpacity 
          style={[styles.musicButton, isMusicOn && styles.musicButtonActive]} 
          onPress={toggleMusic}
          disabled={isMusicLoading}
        >
          {isMusicLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons 
              name={isMusicOn ? selectedStream.icon : "musical-notes-outline"} 
              size={24} 
              color={isMusicOn ? theme.colors.primary : theme.colors.onSurface} 
            />
          )}
          <Text style={[styles.buttonLabel, isMusicOn && { color: theme.colors.primary }]}>
            {isMusicLoading ? "Loading..." : isMusicOn ? selectedStream.name : "Play Music"}
          </Text>
        </TouchableOpacity>

        {/* Stop Button */}
        <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
          <Ionicons name="stop-circle-outline" size={20} color={theme.colors.error || "#ef4444"} />
          <Text style={styles.stopButtonText}>End Session</Text>
        </TouchableOpacity>
      </ScrollView>

      <Nav />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const createStyles = (theme: any, mode: TimerMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.onBackground,
    },
    sessionBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 4,
    },
    sessionText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    modeIndicator: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      gap: 8,
    },
    modeIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    modeIconActive: {
      backgroundColor: mode === "focus" ? theme.colors.primary : theme.colors.secondary,
    },
    modeLine: {
      width: 40,
      height: 2,
      backgroundColor: theme.colors.surface,
    },
    timerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 320,
    },
    timerCircle: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: mode === "focus" ? theme.colors.primary : theme.colors.secondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    progressContainer: {
      position: "absolute",
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      overflow: "hidden",
    },
    progressBackground: {
      position: "absolute",
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      borderWidth: 8,
      borderColor: theme.colors.background,
    },
    progressFill: {
      position: "absolute",
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      borderWidth: 8,
      borderColor: mode === "focus" ? theme.colors.primary : theme.colors.secondary,
      borderTopColor: "transparent",
      borderRightColor: "transparent",
    },
    progressCover: {
      position: "absolute",
      width: CIRCLE_SIZE - 16,
      height: CIRCLE_SIZE - 16,
      borderRadius: (CIRCLE_SIZE - 16) / 2,
      backgroundColor: theme.colors.surface,
      top: 8,
      left: 8,
    },
    timerContent: {
      alignItems: "center",
    },
    timerText: {
      fontSize: 56,
      fontWeight: "bold",
      color: theme.colors.onSurface,
      fontVariant: ["tabular-nums"],
    },
    timerLabel: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
      gap: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.onSurfaceVariant,
    },
    statusDotActive: {
      backgroundColor: "#22c55e",
    },
    statusText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: "500",
    },
    controlsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 24,
      marginTop: 20,
      paddingHorizontal: 24,
    },
    primaryButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: mode === "focus" ? theme.colors.primary : theme.colors.secondary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: mode === "focus" ? theme.colors.primary : theme.colors.secondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    secondaryButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    buttonLabel: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    musicButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 20,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignSelf: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 25,
    },
    musicButtonActive: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    stopButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 24,
      marginBottom: 100,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignSelf: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: theme.colors.error || "#ef4444",
    },
    stopButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.error || "#ef4444",
    },
    // Music picker styles
    musicPickerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    musicPickerContainer: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    musicPickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    musicPickerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.onSurface,
    },
    musicPickerClose: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.background,
      justifyContent: "center",
      alignItems: "center",
    },
    musicPickerList: {
      gap: 12,
    },
    musicPickerScroll: {
      maxHeight: SCREEN_HEIGHT * 0.5,
    },
    musicCategory: {
      marginTop: 16,
    },
    musicCategoryHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    musicCategoryTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    musicPickerItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      gap: 16,
    },
    musicPickerItemActive: {
      backgroundColor: theme.colors.primary + "20",
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    musicPickerIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
    },
    musicPickerIconActive: {
      backgroundColor: theme.colors.primary,
    },
    musicPickerItemText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    musicPickerItemTextActive: {
      color: theme.colors.primary,
    },
    musicPickerHint: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: 20,
    },
    // Loading styles
    loadingOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    loadingContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 32,
      alignItems: "center",
      width: SCREEN_WIDTH * 0.8,
      maxWidth: 320,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
    },
    loadingIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    spinner: {
      marginBottom: 16,
    },
    loadingText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
      textAlign: "center",
      lineHeight: 24,
    },
    loadingDots: {
      flexDirection: "row",
      gap: 8,
      marginTop: 16,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    // Screen saver styles
    screenSaverContainer: {
      flex: 1,
      backgroundColor: "#000",
      justifyContent: "center",
      alignItems: "center",
    },
    screenSaverContent: {
      alignItems: "center",
    },
    screenSaverTime: {
      fontSize: 96,
      fontWeight: "bold",
      color: "#fff",
      fontVariant: ["tabular-nums"],
      textShadowColor: mode === "focus" ? theme.colors.primary : theme.colors.secondary,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 30,
    },
    screenSaverProgressContainer: {
      alignItems: "center",
      marginTop: 32,
      width: SCREEN_WIDTH * 0.7,
    },
    screenSaverProgressBackground: {
      width: "100%",
      height: 6,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 3,
      overflow: "hidden",
    },
    screenSaverProgressFill: {
      height: "100%",
      borderRadius: 3,
    },
    screenSaverProgressText: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.6)",
      marginTop: 12,
      fontWeight: "500",
    },
    screenSaverHint: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.4)",
      marginTop: 24,
    },
  });
