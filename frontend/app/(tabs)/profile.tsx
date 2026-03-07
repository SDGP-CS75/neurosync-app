import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Reusable "Settings Item" Component
const SettingsItem = ({ icon, label, value, isSwitch = false, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    activeOpacity={isSwitch ? 1 : 0.7}
    className="flex-row items-center justify-between bg-white p-4 rounded-2xl mb-3 shadow-sm shadow-gray-200"
  >
    <View className="flex-row items-center">
      <View className="bg-purple-50 p-2 rounded-xl mr-4">
        <Ionicons name={icon} size={22} color="#7C3AED" />
      </View>
      <Text className="text-gray-700 text-base font-semibold">{label}</Text>
    </View>
    
    {isSwitch ? (
      <Switch 
        value={value} 
        trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
        thumbColor={value ? "#7C3AED" : "#f4f3f4"}
      />
    ) : (
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      
      {/* Background Blobs */}
      <View className="absolute top-0 left-0 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-30 -translate-x-10 -translate-y-10" />
      <View className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-30 translate-x-10 -translate-y-10" />

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Profile</Text>
          <TouchableOpacity>
            <Ionicons name="create-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View className="items-center mb-10">
          <View className="relative">
            {/* FIXED IMAGE: Explicit inline styles applied (Larger for profile) */}
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80' }}
              style={{ width: 112, height: 112, borderRadius: 56, borderWidth: 4, borderColor: 'white' }}
            />
            <TouchableOpacity className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full border-2 border-white">
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-gray-800 mt-4">Desmond Miles</Text>
          <Text className="text-gray-500">desmond.miles@gmail.com</Text>
        </View>

        {/* General Settings Section */}
        <Text className="text-gray-500 font-bold mb-4 ml-1">General</Text>
        
        <SettingsItem 
          icon="moon-outline" 
          label="Dark Mode" 
          isSwitch 
          value={isDarkMode} 
          onPress={() => setIsDarkMode(!isDarkMode)} 
        />
        <SettingsItem 
          icon="notifications-outline" 
          label="Notifications" 
          isSwitch 
          value={isNotificationsEnabled} 
          onPress={() => setIsNotificationsEnabled(!isNotificationsEnabled)} 
        />
        <SettingsItem 
          icon="language-outline" 
          label="Language" 
          onPress={() => {}} 
        />

        {/* Account Section */}
        <Text className="text-gray-500 font-bold mb-4 ml-1 mt-4">Account</Text>
        
        <SettingsItem 
          icon="person-outline" 
          label="Personal Info" 
          onPress={() => {}} 
        />
        <SettingsItem 
          icon="lock-closed-outline" 
          label="Security" 
          onPress={() => {}} 
        />
        <SettingsItem 
          icon="help-circle-outline" 
          label="Help & Support" 
          onPress={() => {}} 
        />

        {/* Logout Button */}
        <TouchableOpacity className="mt-8 mb-10 bg-purple-100 py-4 rounded-2xl flex-row justify-center items-center">
          <Ionicons name="log-out-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
          <Text className="text-purple-700 font-bold text-lg">Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}