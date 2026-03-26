import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function TabsLayout() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      router.replace('/(auth)/welcome');
    }
  }, [isCheckingAuth, isAuthenticated]);

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'fade',
      }}
    >
      {/* ── Existing screens ── */}
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="mood-tracking" />
      <Stack.Screen name="todo-list" />

      {/* ── New full screens (navigate to with router.push) ── */}
      <Stack.Screen
        name="session-history"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="calendar"
        options={{ animation: 'slide_from_right' }}
      />
    </Stack>
  );
}