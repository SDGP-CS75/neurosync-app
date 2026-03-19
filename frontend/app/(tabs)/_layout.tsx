import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, 
        contentStyle: { backgroundColor: 'transparent' } 
      }}
    >
      {/* 1. This sets your Dashboard as the main starting screen */}
      <Stack.Screen name="index" /> 
      
      {/* 2. This registers your specific Profile screen */}
      <Stack.Screen name="profile" />

      {/* 3. Keeping your original home screen just in case you need it later */}
      <Stack.Screen name="home" />
      <Stack.Screen name="mood-tracking" />
    </Stack>
  );
}