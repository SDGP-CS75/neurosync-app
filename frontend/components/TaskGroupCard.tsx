import React from 'react';
import { View, Text } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';

interface TaskGroupCardProps {
  title: string;
  tasks: number;
  progress: number;
  icon: React.ReactNode;
  iconBgColor: string;
}

export default function TaskGroupCard({
  title,
  tasks,
  progress,
  icon,
  iconBgColor,
}: TaskGroupCardProps) {
  return (
    <View className="flex-row justify-between items-center bg-white p-4 rounded-2xl mb-3">
      <View className="flex-row items-center">
        <View className={`p-3 rounded-xl ${iconBgColor} mr-4`}>{icon}</View>
        <View>
          <Text className="text-lg font-semibold text-gray-800">{title}</Text>
          <Text className="text-gray-500">{tasks} Tasks</Text>
        </View>
      </View>
      <CircularProgress
        value={progress}
        radius={28}
        duration={1000}
        progressValueColor={'#000'}
        activeStrokeColor={progress > 80 ? '#F59E0B' : '#8B5CF6'}
        inActiveStrokeColor={'#E5E7EB'}
        inActiveStrokeOpacity={0.5}
        activeStrokeWidth={6}
        inActiveStrokeWidth={6}
        valueSuffix={'%'}
        titleStyle={{ fontWeight: 'bold' }}
      />
    </View>
  );
}