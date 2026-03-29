import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('[AuthLayout] Checking authentication status...');
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isAuth = !!user;
      console.log('[AuthLayout] Auth state changed:', isAuth ? 'User already authenticated' : 'User not authenticated');
      setIsAuthenticated(isAuth);
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated) {
      console.log('[AuthLayout] User already authenticated, redirecting to tabs...');
      router.replace('/(tabs)/home');
    }
  }, [isCheckingAuth, isAuthenticated]);

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If already authenticated, don't render auth screens (redirect will happen)
  if (isAuthenticated) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="welcome2" />
      <Stack.Screen name="welcome3" />
      <Stack.Screen name="signIn" />
      <Stack.Screen name="signUp" />
    </Stack>
  );
}