import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'none' }}>
      <Stack.Screen name="home" />
      
      {/* 4. Registering Settings since it's also part of your assignment */}
      <Stack.Screen name="settings" />
    </Stack>
  );
}