import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CircularProgress from 'react-native-circular-progress-indicator';
import { useRouter } from 'expo-router'; // <-- Added router import

// Import your components
import SectionTitle from '../../components/SectionTitle';
import InProgressCard from '../../components/InProgressCard';
import TaskGroupCard from '../../components/TaskGroupCard';
import BottomNavBar from '../../components/BottomNavBar';

export default function DashboardScreen() {
  const router = useRouter(); // <-- Initialize the router

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
        
        {/* Header - Now Clickable! */}
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity 
            className="flex-row items-center"
            onPress={() => router.push('/profile')} // <-- Navigates to profile.tsx
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: 'https://i.pravatar.cc/300' }}
              className="w-12 h-12 rounded-full mr-3"
            />
            <View>
              <Text className="text-gray-500 text-base">Hello!</Text>
              <Text className="text-xl font-bold text-gray-800">Desmond Miles</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-white p-2 rounded-full shadow-sm shadow-gray-200">
            <Ionicons name="notifications-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View className="bg-purple-600 rounded-3xl p-6 mb-6 flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text className="text-white text-xl font-bold mb-4 leading-7">
              Your today's task{'\n'}almost done!
            </Text>
            <TouchableOpacity className="bg-white py-3 px-6 rounded-xl self-start">
              <Text className="text-purple-700 font-semibold">View Task</Text>
            </TouchableOpacity>
          </View>
          <View className="items-center">
            <TouchableOpacity className="self-end mb-2">
              <Ionicons name="ellipsis-horizontal" size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
            <CircularProgress
              value={85}
              radius={45}
              duration={1500}
              progressValueColor={'#fff'}
              activeStrokeColor={'#fff'}
              inActiveStrokeColor={'rgba(255,255,255,0.2)'}
              activeStrokeWidth={8}
              inActiveStrokeWidth={8}
              valueSuffix={'%'}
              titleStyle={{ fontWeight: 'bold' }}
            />
          </View>
        </View>

        {/* In Progress Section */}
        <SectionTitle title="In Progress" count={6} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <InProgressCard
            title="Office Project"
            subtitle="Grocery shopping app design"
            icon={<Ionicons name="briefcase-outline" size={24} color="#8B5CF6" />}
            bgColor="bg-purple-100"
            progress={0.7}
            progressColor="#8B5CF6"
          />
          <InProgressCard
            title="Personal Project"
            subtitle="Uber Eats redesign challenge"
            icon={<Ionicons name="person-outline" size={24} color="#F97316" />}
            bgColor="bg-orange-100"
            progress={0.5}
            progressColor="#F97316"
          />
        </ScrollView>

        {/* Task Groups Section */}
        <SectionTitle title="Task Groups" count={4} />
        <View className="mb-24">
          <TaskGroupCard
            title="Office Project"
            tasks={23}
            progress={70}
            icon={<Ionicons name="briefcase-outline" size={24} color="#EC4899" />}
            iconBgColor="bg-pink-100"
          />
          <TaskGroupCard
            title="Office Project"
            tasks={30}
            progress={70}
            icon={<MaterialCommunityIcons name="briefcase-clock-outline" size={24} color="#8B5CF6" />}
            iconBgColor="bg-purple-100"
          />
          <TaskGroupCard
            title="Daily Study"
            tasks={30}
            progress={87}
            icon={<Ionicons name="book-outline" size={24} color="#F59E0B" />}
            iconBgColor="bg-orange-100"
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </SafeAreaView>
  );
}