import React from 'react';
import { View, Text } from 'react-native';
import * as Progress from 'react-native-progress';

interface InProgressCardProps {
  title: string;
  subtitle: string;
  bgColor: string;
  progress: number;
  progressColor: string;
}

export default function InProgressCard({
  title,
  subtitle,
  bgColor,
  progress,
  progressColor,
}: InProgressCardProps) {
  return (
    <View className={`p-4 rounded-[22px] mr-4 w-[170px] ${bgColor}`}>
      <Text className="text-gray-500 text-[13px] font-medium mb-1.5">{title}</Text>
      <Text className="text-[15px] font-bold text-gray-900 mb-3 leading-5 min-h-[40px]">
        {subtitle}
      </Text>
      <Progress.Bar
        progress={progress}
        width={null}
        color={progressColor}
        unfilledColor="rgba(255,255,255,0.6)"
        borderWidth={0}
        height={6}
        borderRadius={4}
      />
    </View>
  );
}