import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomNavBar from '../../components/BottomNavBar'; // Brings in your custom nav bar

const THEMES = [
  { id: 'violet', color: '#7C3AED', label: 'Violet' },
  { id: 'blue', color: '#3B82F6', label: 'Blue' },
  { id: 'green', color: '#10B981', label: 'Green' },
  { id: 'pink', color: '#EC4899', label: 'Pink' },
  { id: 'orange', color: '#F59E0B', label: 'Orange' },
  { id: 'gray', color: '#6B7280', label: 'Gray' },
  { id: 'teal', color: '#14B8A6', label: 'Teal' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const [activeTheme, setActiveTheme] = useState('violet');
  
  // Settings States
  const [dailyReminders, setDailyReminders] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [strictFocus, setStrictFocus] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      
      {/* Background Glassmorphism Blobs */}
      <View className="absolute top-0 left-0 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-30 -translate-x-10 -translate-y-10" />
      
      <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm shadow-gray-200"
          >
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Settings</Text>
          <View className="w-10 h-10" /> {/* Spacer */}
        </View>

        {/* Theme Picker Section */}
        <View className="bg-white p-6 rounded-3xl shadow-sm shadow-gray-200 mb-6 border border-gray-100 items-center">
          <Text className="text-purple-700 font-bold text-sm uppercase tracking-wider mb-6">
            App Colour Theme
          </Text>
          
          <View className="flex-row justify-center space-x-3 mb-4 flex-wrap">
            {THEMES.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                onPress={() => setActiveTheme(theme.id)}
                className={`w-10 h-10 rounded-full m-1 items-center justify-center ${activeTheme === theme.id ? 'border-4 border-purple-200' : ''}`}
                style={{ backgroundColor: theme.color }}
              >
                {activeTheme === theme.id && <Ionicons name="checkmark" size={20} color="white" />}
              </TouchableOpacity>
            ))}
          </View>
          
          <Text className="text-purple-600 font-bold mt-2">
            {THEMES.find(t => t.id === activeTheme)?.label}
          </Text>
        </View>

        {/* App Preferences */}
        <Text className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-3 ml-1">
          Preferences
        </Text>
        
        <View className="bg-white rounded-3xl p-4 shadow-sm shadow-gray-100 border border-gray-50 mb-6">
          {/* Setting Row */}
          <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-purple-50 justify-center items-center mr-3">
                <Ionicons name="notifications" size={16} color="#7C3AED" />
              </View>
              <Text className="text-gray-700 font-medium text-base">Daily Reminders</Text>
            </View>
            <Switch 
              value={dailyReminders} 
              onValueChange={setDailyReminders}
              trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
              thumbColor={dailyReminders ? "#7C3AED" : "#f4f3f4"}
            />
          </View>

          {/* Setting Row */}
          <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-purple-50 justify-center items-center mr-3">
                <Ionicons name="phone-portrait" size={16} color="#7C3AED" />
              </View>
              <Text className="text-gray-700 font-medium text-base">Haptic Feedback</Text>
            </View>
            <Switch 
              value={hapticFeedback} 
              onValueChange={setHapticFeedback}
              trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
              thumbColor={hapticFeedback ? "#7C3AED" : "#f4f3f4"}
            />
          </View>

          {/* Setting Row */}
          <View className="flex-row justify-between items-center py-3">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-red-50 justify-center items-center mr-3">
                <Ionicons name="shield-checkmark" size={16} color="#EF4444" />
              </View>
              <View>
                <Text className="text-gray-700 font-medium text-base">Strict Focus Mode</Text>
                <Text className="text-gray-400 text-xs">Blocks other apps during focus</Text>
              </View>
            </View>
            <Switch 
              value={strictFocus} 
              onValueChange={setStrictFocus}
              trackColor={{ false: "#E5E7EB", true: "#FECACA" }}
              thumbColor={strictFocus ? "#EF4444" : "#f4f3f4"}
            />
          </View>
        </View>

        <View className="h-24" /> {/* Spacer so scrolling doesn't hide behind nav bar */}
      </ScrollView>

      {/* Reusing your Bottom Navigation Bar component */}
      <BottomNavBar />
    </SafeAreaView>
  );
}