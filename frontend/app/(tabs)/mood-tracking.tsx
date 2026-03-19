import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated } from "react-native";
import { useState, useRef, useEffect } from "react";
import Slider from "@react-native-community/slider";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Nav from "../../components/Nav";

export default function MoodTracking() {

  const { colors } = useTheme() as any;

  const [note, setNote] = useState("");
  const [mood, setMood] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const saveEntry = () => {
    const entry = {
      mood,
      energyLevel,
      note,
      tags: selectedTags,
      timestamp: new Date().toISOString()
    };

    console.log("Mood Entry:", entry);
  };

  // Entrance animation for smoother transitions
  const entranceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [entranceAnim]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View
        style={{
          flex: 1,
          opacity: entranceAnim,
          transform: [
            {
              translateY: entranceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        }}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{
            paddingTop: 40,
            paddingBottom: 140, // extra space so bottom navigation doesn't overlap content
            alignItems: "center"
          }}
        >

          <View
            style={{
              width: "100%",
              maxWidth: 420,
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20
            }}
          >

            {/* Header */}

            <View style={{ alignItems: "center", marginTop: 20 }}>

              <Text style={{ fontSize: 16, color: colors.textMuted }}>
                {dateString} • {timeString}
              </Text>

              <Text style={{ fontSize: 60, marginTop: 10 }}>
                {currentMood.emoji}
              </Text>

              <Text style={{ fontSize: 26, fontWeight: "600", color: colors.primary }}>
                {currentMood.label}
              </Text>

              <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                {currentMood.message}
              </Text>

            </View>


            {/* Note Input */}

            <TextInput
              placeholder="What made you feel this way?"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              style={{
                backgroundColor: colors.surfaceVariant,
                borderRadius: 16,
                padding: 16,
                marginTop: 24,
                minHeight: 80,
                color: colors.onBackground,
                textAlignVertical: "top"
              }}
            />


            {/* Tags */}

            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 16 }}>

              {tags.map((tag, index) => {

                const isSelected = selectedTags.includes(tag);

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => toggleTag(tag)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 20,
                      marginRight: 8,
                      marginBottom: 8,
                      backgroundColor: isSelected ? colors.primary : colors.primaryContainer
                    }}
                  >

                    <Text style={{ color: isSelected ? colors.onPrimary : colors.onPrimaryContainer }}>
                      {tag}
                    </Text>

                  </TouchableOpacity>
                );
              })}

            </View>


            {/* Mood Selector */}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 30
              }}
            >

              {moods.map((m, index) => {

                const isSelected = mood === index;

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setMood(index)}
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: isSelected ? colors.primaryContainer : "transparent"
                    }}
                  >

                    <Text style={{ fontSize: 30 }}>
                      {m.emoji}
                    </Text>

                  </TouchableOpacity>
                );
              })}

            </View>


            {/* Energy Level */}

            <View style={{ marginTop: 30 }}>

              <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: colors.onBackground }}>
                ⚡ Energy Level
              </Text>

              <Slider
                minimumValue={0}
                maximumValue={10}
                step={1}
                value={energyLevel}
                onValueChange={(value: number) => setEnergyLevel(value)}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.outline}
                thumbTintColor={colors.primary}
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

              <Text style={{ textAlign: "right", marginTop: 4, color: colors.textMuted }}>
                Energy: {energyLevel}
              </Text>

            </View>


            {/* Save Button */}

            <TouchableOpacity
              onPress={saveEntry}
              style={{
                backgroundColor: colors.secondary,
                padding: 16,
                borderRadius: 16,
                marginTop: 40,
                marginBottom: 30
              }}
            >

              <Text style={{ color: colors.onSecondary, textAlign: "center", fontWeight: "600" }}>
                Save Entry
              </Text>

            </TouchableOpacity>

          </View>

        </ScrollView>

        <Nav />

      </Animated.View>
    </SafeAreaView>
  );
}