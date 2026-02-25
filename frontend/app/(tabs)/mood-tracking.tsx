import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";

export default function MoodTracking() {
  const [note, setNote] = useState("");
  const [energyLevel, setEnergyLevel] = useState(3);

  const emojis = ["😡","😕","🙂","😊","😍"];

  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 16, paddingTop: 40 }}>

      {/* Header */}
      <View className="items-center">
        <Text className="text-6xl">😊</Text>
        <Text className="text-xl font-semibold mt-2">
          Feeling Good
        </Text>
        <Text className="text-gray-400">
          Your energy feels bright today
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