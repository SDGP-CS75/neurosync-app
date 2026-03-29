import React, { useMemo } from 'react';
import { ImageBackground, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '../../context/ThemeContext';

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();

  const isSmallScreen  = width < 375;
  const isMediumScreen = width >= 375 && width < 768;
  const isLargeScreen = width >= 768;

  const dynamicStyles = useMemo(() => ({
    container: {
      paddingHorizontal: isSmallScreen ? 16 : isMediumScreen ? 24 : 32,
      paddingVertical: isSmallScreen ? 16 : 24,
      paddingTop: isSmallScreen ? 50 : isMediumScreen ? 80 : 100,
    },
    image: {
      width: isSmallScreen ? 300 : isMediumScreen ? 400 : 500,
      height: isSmallScreen ? 300 : isMediumScreen ? 400 : 500,
    },
    title: {
      fontSize: isSmallScreen ? 28 : isMediumScreen ? 36 : 48,
    },
    subtitle: {
      fontSize: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
      maxWidth: isSmallScreen ? 300 : isMediumScreen ? 350 : 400,
      lineHeight: isSmallScreen ? 18 : 20,
    },
    button: {
      paddingVertical: isSmallScreen ? 5 : 7,
      paddingHorizontal: isSmallScreen ? 5 : 7,
      marginBottom: isSmallScreen ? 10 : 15,
    },
    loginText: {
      fontSize: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
    },
    loginLink: {
      fontSize: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
    },
    footer: {
      marginBottom: isSmallScreen ? 20 : isMediumScreen ? 25 : 30,
    },
  }), [isSmallScreen, isMediumScreen, isLargeScreen]);

  return (
    <ImageBackground 
      source={require('../../images/bgimg.png')} 
      style={styles.background}
      fadeDuration={0}
    >
      <View style={[styles.container, dynamicStyles.container]}>
        <ImageBackground 
          source={require('../../images/welcome1.png')} 
          style={[styles.image, dynamicStyles.image]}
          resizeMode="contain"
          fadeDuration={0}
        >

        </ImageBackground>
        <Text style={[styles.title, dynamicStyles.title, { color: theme.colors.onBackground }]}>
          Your Calm Focus Companion
        </Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle, { color: theme.colors.textMuted }]}>
          Plan tasks, stay present, and move forward at your own pace with a distraction-free productivity experience.
        </Text>

        <Button
          mode="contained"
          style={[styles.button, dynamicStyles.button]}
          onPress={() => router.push('/(auth)/welcome2')}
        >
          Let's Start
        </Button>
        <View style={[styles.footer, dynamicStyles.footer]}>
          <Text style={[styles.loginText, dynamicStyles.loginText, { color: theme.colors.textMuted }]}>
            Already have an account? 
            <Text 
              style={[styles.loginLink, dynamicStyles.loginLink, { color: theme.colors.primary }]}
              onPress={() => router.push('/(auth)/signIn')}>
              Login
            </Text>
          </Text>
        </View>

      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    marginTop: 0,
    marginBottom: 0,
  },
  title: {
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    marginTop: 'auto',
    maxWidth: 400,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  loginText: {
    textAlign: 'center',
  },
  loginLink: {
    fontWeight: 'bold',
  },
});
