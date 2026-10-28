import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Pressable, StyleSheet, Animated } from "react-native";
import { useState } from "react";
import { BlurView } from 'expo-blur';
import Slider from "@react-native-community/slider";
import { useTheme } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { auth } from "../../services/firebase";
import { saveMoodEntry } from "../../services/moodStorage";
import type { MoodEntry } from "../../types";
import Nav from "../../components/Nav";
import { useFadeIn, useSlideUp } from "../../utils/animations";

export default function MoodTracking() {

  const { colors } = useTheme() as any;
  const insets = useSafeAreaInsets();
  
  // Animation hooks
  const fadeAnim = useFadeIn(300, 100);
  const { slideAnim } = useSlideUp(400, 200);

  // compute bottom padding to avoid overlap with bottom navigation
  // keep minimal extra space so nav remains fixed at the bottom like on home
  const bottomPadding = Math.max(insets.bottom, 12) + 60;

  const [note, setNote] = useState("");
  const [mood, setMood] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const tags = ["Work", "Family", "Sleep", "Friends", "Health", "Hobby", "Love"];

  const moods = [
    { emoji: "😡", label: "Feeling Angry", message: "Take a breath. It's okay to slow down." },
    { emoji: "😕", label: "Feeling Off", message: "Something feels a bit off today." },
    { emoji: "🙂", label: "Feeling Okay", message: "A calm and steady day." },
    { emoji: "😊", label: "Feeling Good", message: "Things are looking pretty nice." },
    { emoji: "😍", label: "Feeling Amazing", message: "You're absolutely radiating today!" }
  ];

  const currentMood = moods[mood] ?? moods[0];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const now = new Date();

  const dateString = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  const timeString = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });

  const saveEntry = async () => {
    if (isSaving) return;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setSaveError("Please sign in again before saving a mood.");
      return;
    }

    const entry: MoodEntry = {
      id: `mood_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      mood,
      energyLevel,
      note: note.trim() || undefined,
      tags: selectedTags,
      timestamp: new Date().toISOString(),
      isSynced: false,
    };

    setIsSaving(true);
    setSaveError(null);
    try {
      await saveMoodEntry(uid, entry);
      setNote("");
      setSelectedTags([]);
      setMood(3);
      setEnergyLevel(3);
      setShowSavedModal(true);
    } catch (error) {
      console.error("Failed to save mood entry:", error);
      setSaveError("Your mood could not be saved. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // no entrance animation

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 40,
            paddingBottom: bottomPadding, // use safe area to avoid nav overlap
            alignItems: "stretch",
            paddingHorizontal: 0,
          }}
        >
            {/* Header */}

            <View style={{ alignItems: "center", marginTop: 0 }}>

              <Text style={{ fontSize: 16, color: colors.textMuted }}>
                {dateString} • {timeString}
              </Text>

              <View style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                backgroundColor: colors.surfaceVariant,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 12,
                boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.06)',
                elevation: 6,
              }}>
                <Text style={{ fontSize: 48 }}>{currentMood.emoji}</Text>
              </View>

              <Text style={{ fontSize: 26, fontWeight: "600", color: colors.primary, marginTop: 12 }}>
                {currentMood.label}
              </Text>

              <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                {currentMood.message}
              </Text>

            </View>


           <View
             style={{
               alignSelf: "stretch",
               marginHorizontal: 16,
               backgroundColor: colors.surface,
               borderRadius: 20,
               padding: 20,
               // subtle card shadow
               boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.06)",
               marginTop: 32,
             }}
          >
            {/* Note Input */}
            <TextInput
              placeholder="What made you feel this way?"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              accessibilityLabel="Mood note"
              style={{
                backgroundColor: colors.surfaceVariant,
                borderRadius: 12,
                padding: 16,
                marginTop: 20,
                minHeight: 100,
                color: colors.onBackground,
                textAlignVertical: "top",
                 // card-like inset
                 boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.04)",
              }}
            />

            {/* Tags */}

            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 18 }}>

              {tags.map((tag, index) => {

                const isSelected = selectedTags.includes(tag);

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => toggleTag(tag)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={tag}
                    accessibilityState={{ checked: isSelected }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 20,
                      marginRight: 8,
                      marginBottom: 8,
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderWidth: isSelected ? 0 : 1,
                       borderColor: isSelected ? 'transparent' : colors.surfaceVariant,
                       boxShadow: isSelected ? '0px 4px 8px rgba(0, 0, 0, 0.04)' : '0px 4px 8px rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <Text style={{ color: isSelected ? colors.onPrimary : colors.onSurface }}>
                      {tag}
                    </Text>
                  
                  </TouchableOpacity>
                );
              })}

            </View>


            {/* Mood Selector (all emojis visible, smaller) */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 18,
              flexWrap: 'nowrap',
            }}>
              {moods.map((m, index) => {
                const isSelected = mood === index;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setMood(index)}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityLabel={m.label}
                    accessibilityState={{ checked: isSelected }}
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginHorizontal: 4,
                    }}
                  >
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: isSelected ? 6 : 2,
                    }}>
                      <Text style={{ fontSize: 22, color: isSelected ? '#fff' : colors.onBackground }}>
                        {m.emoji}
                      </Text>
                    </View>
                    <Text style={{ marginTop: 6, fontSize: 11, color: isSelected ? colors.primary : colors.textMuted }}>
                      {m.label.split(' ')[1]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {/* Page background blur (behind content) */}
            <BlurView
              intensity={40}
              tint="light"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 20,
                zIndex: -1,
              }}
            />
          </View>
          
            {/* Energy Level */}

            <View style={{ marginTop: 24, marginHorizontal: 16 }}>

              <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: colors.onBackground }}>
                ⚡ Energy Level
              </Text>

              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                paddingTop: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 4,
              }}>

                <Slider
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  value={energyLevel}
                  onValueChange={(value: number) => setEnergyLevel(value)}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.outline}
                  thumbTintColor={colors.primary}
                  accessibilityLabel="Energy level"
                  accessibilityValue={{
                    min: 0,
                    max: 10,
                    now: energyLevel,
                    text: `${energyLevel} out of 10`,
                  }}
                />

                <View style={{ flexDirection: "row", marginTop: 10 }}>
                  {[...Array(10)].map((_, index) => (
                    <View
                      key={index}
                      style={{
                        flex: 1,
                        height: 6,
                        marginRight: index === 9 ? 0 : 4,
                        borderRadius: 4,
                        backgroundColor: index < energyLevel ? colors.primary : colors.outline
                      }}
                    />
                  ))}
                </View>

                <Text style={{ textAlign: "right", marginTop: 8, color: colors.textMuted }}>
                  Energy: {energyLevel}
                </Text>

              </View>

            </View>


            {/* Save Button */}
            <TouchableOpacity
              onPress={saveEntry}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel={isSaving ? "Saving mood entry" : "Save mood entry"}
              accessibilityState={{ busy: isSaving, disabled: isSaving }}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 28,
                marginTop: 20,
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'stretch',
                marginHorizontal: 16,
                marginBottom: 38,
                opacity: isSaving ? 0.65 : 1,
              }}
            >
            
              <Text style={{ color: colors.onPrimary, textAlign: "center", fontWeight: "700", fontSize: 16 }}>
                {isSaving ? "Saving..." : "Save Entry"}
              </Text>

            </TouchableOpacity>
            {saveError && (
              <Text
                accessibilityRole="alert"
                style={{
                  color: colors.error,
                  marginHorizontal: 16,
                  marginTop: -24,
                  marginBottom: 28,
                  textAlign: "center",
                }}
              >
                {saveError}
              </Text>
            )}

        </ScrollView>

      </Animated.View>

      {/* place Nav as a direct child of SafeAreaView so it stays fixed to the bottom */}
      <Nav />

      {/* Saved modal overlay (shown after saving an entry) */}
      <Modal transparent animationType="fade" visible={showSavedModal} onRequestClose={() => setShowSavedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.savedCard, { backgroundColor: colors.background }] }>
            <View style={styles.savedEmojiWrap}>
              <Text style={styles.savedEmoji}>😍</Text>
            </View>
            <Text style={[{ fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 12, color: colors.onBackground }]}>You're on a good way!</Text>
            <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 8 }}>Your day is going amazing{"\n"}Keep tracking your mood to improve your mental health.</Text>

            <Pressable
              onPress={() => setShowSavedModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss mood saved message"
              style={({ pressed }) => [
                {
                  marginTop: 18,
                  paddingVertical: 14,
                  paddingHorizontal: 36,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                  width: '80%',
                  alignSelf: 'center',
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
     
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontWeight: '700' },
  // saved modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  savedCard: { width: '100%', maxWidth: 360, borderRadius: 18, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  savedEmojiWrap: { width: 110, height: 110, borderRadius: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, marginTop: -60 },
  savedEmoji: { fontSize: 48 },
});
