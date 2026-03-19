import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNavBar() {
  return (
    <View className="absolute bottom-5 left-5 right-5 bg-white flex-row justify-between items-center p-2 rounded-full shadow-sm shadow-gray-300">
      <TouchableOpacity className="p-3">
        <Ionicons name="home" size={24} color="#8B5CF6" />
      </TouchableOpacity>
      <TouchableOpacity className="p-3">
        <Ionicons name="calendar-outline" size={24} color="#9CA3AF" />
      </TouchableOpacity>
      <TouchableOpacity className="bg-purple-600 p-4 rounded-full -mt-8 shadow-lg shadow-purple-300">
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity className="p-3">
        <Ionicons name="time-outline" size={24} color="#9CA3AF" />
      </TouchableOpacity>
      <TouchableOpacity className="p-3">
        <Ionicons name="document-text-outline" size={24} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}