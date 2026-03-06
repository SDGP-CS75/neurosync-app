import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";

export default function MoodTracking() {
  const [note, setNote] = useState("");
  const [energyLevel, setEnergyLevel] = useState(3);

  const emojis = ["😡","😕","🙂","😊","😍"];

  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 16, paddingTop: 40 }}>

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
        className="bg-gray-100 rounded-xl p-4 mt-6"
      />

      {/* Energy Selector */}
      <View className="flex-row justify-between mt-8">
        {emojis.map((e, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setEnergyLevel(index)}
          >
            <Text className="text-3xl">{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Save Button */}
      <TouchableOpacity className="bg-purple-500 p-4 rounded-xl mt-10">
        <Text className="text-white text-center font-semibold">
          Save Entry
        </Text>
      </TouchableOpacity>

    </View>
  );
}