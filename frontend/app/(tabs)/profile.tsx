import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Reusable component for grouped settings items to keep the code clean
interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  isSwitch?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
}

const SettingsItem = ({
  icon,
  label,
  isSwitch = false,
  value,
  onValueChange,
  onPress
}: SettingsItemProps) => (
  <TouchableOpacity
    className="flex-row items-center justify-between bg-white p-4 rounded-2xl mb-3 shadow-sm shadow-gray-100 border border-gray-50"
    onPress={isSwitch ? undefined : onPress}
    activeOpacity={isSwitch ? 1 : 0.7}
  >
    <View className="flex-row items-center flex-1">
      <View className="w-10 h-10 rounded-xl bg-purple-50 justify-center items-center mr-4">
        {icon}
      </View>
      <Text className="text-gray-800 text-base font-medium flex-1">{label}</Text>
    </View>
    
    {isSwitch ? (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
        thumbColor={value ? "#7C3AED" : "#f4f3f4"}
      />
    ) : (
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    )}
  </TouchableOpacity>
);

// Reusable component for section titles
const SettingsGroupTitle = ({ title }: { title: string }) => (
  <Text className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-3 ml-1 mt-6">
    {title}
  </Text>
);

export default function ProfileScreen() {
  const router = useRouter();
  
  // State for our ADHD-friendly toggles
  const [isAiSuggestionsEnabled, setIsAiSuggestionsEnabled] = useState(true);
  const [isFocusModeEnabled, setIsFocusModeEnabled] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Background Glassmorphism Blobs */}
      <View className="absolute top-0 left-0 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-30 -translate-x-10 -translate-y-10" />
      <View className="absolute top-40 right-0 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-30 translate-x-10" />

      <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm shadow-gray-200"
          >
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Profile</Text>
          <View className="w-10 h-10" /> {/* Spacer for centering */}
        </View>

        {/* Profile Avatar Card */}
        <View className="items-center mb-2">
          <View className="relative mb-4">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80' }}
              style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#FFFFFF' }}
            />
            <TouchableOpacity className="absolute bottom-0 right-0 bg-purple-600 w-8 h-8 rounded-full border-2 border-white items-center justify-center shadow-sm">
              <Ionicons name="camera" size={14} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-gray-800">Sujaya</Text>
          <Text className="text-gray-500 text-sm mt-1">sujaya@example.com</Text>
          
          <TouchableOpacity className="mt-4 bg-white px-6 py-2 rounded-full border border-gray-200 shadow-sm shadow-gray-100">
            <Text className="text-gray-700 font-semibold">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* NeuroSync Specific Settings */}
        <SettingsGroupTitle title="NeuroSync Preferences" />
        <SettingsItem
          icon={<MaterialCommunityIcons name="brain" size={22} color="#7C3AED" />}
          label="AI Routine Suggestions"
          isSwitch
          value={isAiSuggestionsEnabled}
          onValueChange={setIsAiSuggestionsEnabled}
        />
        <SettingsItem
          icon={<Ionicons name="headset" size={22} color="#7C3AED" />}
          label="Deep Focus Mode"
          isSwitch
          value={isFocusModeEnabled}
          onValueChange={setIsFocusModeEnabled}
        />
        <SettingsItem
          icon={<Ionicons name="musical-notes" size={22} color="#7C3AED" />}
          label="Focus Timer Sounds"
          onPress={() => {}} 
        />

        {/* Customization */}
        <SettingsGroupTitle title="Customization" />
        
        {/* FIX: This now routes to your Settings screen! */}
        <SettingsItem
          icon={<Ionicons name="color-palette" size={22} color="#10B981" />}
          label="App Theme"
          onPress={() => router.push('/settings')} 
        />
        
        <SettingsItem
          icon={<Ionicons name="notifications" size={22} color="#10B981" />}
          label="Notification Schedule"
          onPress={() => {}} 
        />

        {/* Account & Support */}
        <SettingsGroupTitle title="Account" />
        <SettingsItem
          icon={<Ionicons name="lock-closed" size={22} color="#6B7280" />}
          label="Security & Password"
          onPress={() => {}} 
        />
        <SettingsItem
          icon={<Ionicons name="help-buoy" size={22} color="#6B7280" />}
          label="Help & Support"
          onPress={() => {}} 
        />

        {/* Logout Button */}
        <TouchableOpacity className="mt-8 mb-12 bg-purple-100 py-4 rounded-2xl items-center flex-row justify-center">
          <Ionicons name="log-out-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
          <Text className="text-purple-700 text-lg font-bold">Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}