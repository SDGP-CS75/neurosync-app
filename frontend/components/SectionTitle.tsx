import React from 'react';
import { View, Text } from 'react-native';

interface SectionTitleProps {
  title: string;
  count: number;
}

export default function SectionTitle({ title, count }: SectionTitleProps) {
  return (
    <View className="flex-row justify-between items-center my-4">
      <View className="flex-row items-center">
        <Text className="text-xl font-bold text-gray-800 mr-2">{title}</Text>
        <View className="bg-gray-200 rounded-full w-6 h-6 items-center justify-center">
          <Text className="text-gray-600 text-xs font-bold">{count}</Text>
        </View>
      </View>
    </View>
  );
}