import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import Slider from "@react-native-community/slider";

export default function MoodTracking() {
  const [note, setNote] = useState("");
  const [mood, setMood] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const tags = ["Work", "Family", "Sleep", "Friends", "Health", "Hobby", "Love"];

  const moods: { emoji: string; label: string; message: string }[] = [
    { emoji: "😡", label: "Feeling Angry", message: "Take a breath. It's okay to slow down." },
    { emoji: "😕", label: "Feeling Off", message: "Something feels a bit off today." },
    { emoji: "🙂", label: "Feeling Okay", message: "A calm and steady day." },
    { emoji: "😊", label: "Feeling Good", message: "Things are looking pretty nice." },
    { emoji: "😍", label: "Feeling Amazing", message: "You're absolutely radiating today!" }
  ];

  const currentMood = moods[mood] ?? moods[0];
  
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
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

  return (
    <ScrollView
      style={{ flex: 1, alignItems: "center",justifyContent:"flex-start" , backgroundColor: "#f3f4f6", paddingTop: 40}}>
      
      <View style={{ width: "100%", maxWidth: 420, backgroundColor:"white", borderRadius: 20, padding: 20 }} >

        {/* Header */}
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text style={{ fontSize: 16, color: "#888" }}>
            {dateString} • {timeString}
          </Text>
          <Text style={{ fontSize: 60, marginTop: 10 }}>
            {currentMood.emoji}
          </Text>
          <Text style={{ fontSize: 26, fontWeight: "600", color: "#4F7CF7" }}>
            {currentMood.label}
          </Text>
          <Text style={{ color: "#888", marginTop: 4 }}>
            {currentMood.message}
          </Text>
        </View>

        {/* Note Input */}
        <TextInput
          placeholder="What made you feel this way?"
          value={note}
          onChangeText={setNote}
          multiline
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: 16,
            padding: 16,
            marginTop: 24,
            minHeight: 80
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
                  backgroundColor: isSelected ? "#4F7CF7" : "#e5e7eb"
                }}
              >
                <Text style={{ color: isSelected ? "white" : "#333" }}>
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
                  backgroundColor: isSelected ? "#e0e7ff" : "transparent"
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
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
            ⚡ Energy Level
          </Text>

          <Slider
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={energyLevel}
            onValueChange={(value: number) => setEnergyLevel(value)}
            minimumTrackTintColor="#4F7CF7"
            maximumTrackTintColor="#d1d5db"
            thumbTintColor="#4F7CF7"
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
                  backgroundColor: index < energyLevel ? "#4F7CF7" : "#e5e7eb"
                }}
              />
            ))}
          </View>

          <Text style={{ textAlign: "right", marginTop: 4 }}>
            Energy: {energyLevel}
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          onPress={saveEntry}
          style={{
            backgroundColor: "#7C3AED",
            padding: 16,
            borderRadius: 16,
            marginTop: 40,
            marginBottom: 30
          }}>
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
            Save Entry
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}