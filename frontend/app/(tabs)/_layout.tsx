import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function TabsLayout() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('[TabsLayout] Checking authentication status...');
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isAuth = !!user;
      console.log('[TabsLayout] Auth state changed:', isAuth ? 'User authenticated' : 'User not authenticated');
      setIsAuthenticated(isAuth);
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      console.log('[TabsLayout] User not authenticated, redirecting to auth...');
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, 
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'fade'
      }}
    >
      {/* 1. This sets your Dashboard as the main starting screen */}
      <Stack.Screen name="index" /> 
      


      {/* 3. Keeping your original home screen just in case you need it later */}
      <Stack.Screen name="home" />
      <Stack.Screen name="mood-tracking" />
    </Stack>
  );
}