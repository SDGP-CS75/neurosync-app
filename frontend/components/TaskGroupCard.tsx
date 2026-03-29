import React from 'react';
import { View, Text } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';

interface TaskGroupCardProps {
  title: string;
  tasks: number;
  progress: number;
  icon: React.ReactNode;
  iconBgColor: string;
  progressColor?: string;
}

export default function TaskGroupCard({
  title,
  tasks,
  progress,
  icon,
  iconBgColor,
  progressColor = '#8B5CF6',
}: TaskGroupCardProps) {
  return (
    <View className="flex-row justify-between items-center bg-white p-4 rounded-[20px] mb-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-50">
      <View className="flex-row items-center">
        <View className={`w-[52px] h-[52px] justify-center items-center rounded-2xl ${iconBgColor} mr-4`}>{icon}</View>
        <View>
          <Text className="text-[16px] font-bold text-gray-900">{title}</Text>
          <Text className="text-[13px] text-gray-500 mt-1">{tasks} Tasks</Text>
        </View>
      </View>
      <CircularProgress
        value={progress}
        radius={22}
        duration={1000}
        progressValueColor={'#000'}
        activeStrokeColor={progressColor}
        inActiveStrokeColor={'#F3F4F6'}
        inActiveStrokeOpacity={1}
        activeStrokeWidth={4}
        inActiveStrokeWidth={4}
        valueSuffix={'%'}
        titleStyle={{ fontWeight: '600', fontSize: 13 }}
      />
    </View>
  );
}