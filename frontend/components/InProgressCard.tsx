import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';

interface InProgressCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  progress: number;
  progressColor: string;
}

export default function InProgressCard({
  title,
  subtitle,
  icon,
  bgColor,
  progress,
  progressColor,
}: InProgressCardProps) {
  return (
    <View className={`p-5 rounded-3xl mr-4 w-64 ${bgColor}`}>
      <View className="flex-row justify-between items-start mb-4">
        <View className="bg-white p-2 rounded-xl">{icon}</View>
        {/* Only show delete icon for Office Project based on the design, or make it a prop */}
        {title === 'Office Project' && (
          <TouchableOpacity>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
      <Text className="text-gray-500 text-sm mb-1">{title}</Text>
      <Text className="text-lg font-bold text-gray-800 mb-4 leading-6">
        {subtitle}
      </Text>
      <Progress.Bar
        progress={progress}
        width={null}
        color={progressColor}
        unfilledColor="rgba(255,255,255,0.5)"
        borderWidth={0}
        height={6}
        borderRadius={4}
      />
    </View>
  );
}