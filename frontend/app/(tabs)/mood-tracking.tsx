import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";
import Slider from "@react-native-community/slider";

export default function MoodTracking() {
  const [note, setNote] = useState("");
  const [mood, setMood] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);

  const emojis = ["😡","😕","🙂","😊","😍"];

  return (
    <View 
      style={{ flex: 1, alignItems: "center",justifyContent:"flex-start" , backgroundColor: "#f3f4f6", paddingTop: 40}}>
      
      <View style={{ width: "100%", maxWidth: 420, backgroundColor:"white", borderRadius: 20, padding: 20 }} >

        {/* Header */}
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text style={{ fontSize: 16, color: "#888" }}>
            Thu, Feb 26 • 01:28 PM
          </Text>

          <Text style={{ fontSize: 60, marginTop: 10 }}>
            🤩
          </Text>

          <Text style={{ fontSize: 26, fontWeight: "600", color: "#4F7CF7" }}>
            Feeling Amazing
          </Text>

          <Text style={{ color: "#888", marginTop: 4 }}>
            You're absolutely radiating today!
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

        {/* Mood Selector */}
        <View  
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 30
          }}
        >
          {emojis.map((e, index) => {
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
                  {e}
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
            onValueChange={(value) => setEnergyLevel(value)}
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
          style={{
            backgroundColor: "#7C3AED",
            padding: 16,
            borderRadius: 16,
            marginTop: 40
          }}>
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
            Save Entry
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}