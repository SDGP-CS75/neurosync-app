import React, { useMemo } from "react";
import { Image, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import { router } from "expo-router";
import { useAppTheme } from "../../context/ThemeContext";

export default function Welcome2() {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();

  const isSmallScreen = width < 375;

  const dynamicStyles = useMemo(() => ({
    image: {
      width:  isSmallScreen ? 300 : 450,
      height: isSmallScreen ? 300 : 450,
    },
    title: {
      fontSize: isSmallScreen ? 22 : 25,
    },
    subtitle: {
      fontSize: isSmallScreen ? 14 : 16,
    },
    button: {
      paddingVertical:   isSmallScreen ? 5 : 7,
      paddingHorizontal: isSmallScreen ? 5 : 7,
      marginBottom:      isSmallScreen ? 10 : 15,
    },
    loginText: {
      fontSize: isSmallScreen ? 14 : 16,
    },
  }), [isSmallScreen]);

  return (
    <SafeAreaView style={styles.container}>

      <Image
        source={require("../../assets/welcome/welcome2.png")}
        style={[styles.image, dynamicStyles.image]}
        resizeMode="contain"
        fadeDuration={0}
      />

      <Text style={[styles.title, dynamicStyles.title, { color: theme.colors.onBackground }]}>
        Reach your full potential
      </Text>

      <Text style={[styles.subtitle, dynamicStyles.subtitle, { color: theme.colors.textMuted }]}>
        Develop new habits and build lifelong skills
      </Text>

      <Button
        mode="contained"
        style={[styles.button, dynamicStyles.button]}
        onPress={() => router.push("/(auth)/welcome3")}
      >
        Let's Start
      </Button>

      <Text style={[styles.loginText, dynamicStyles.loginText, { color: theme.colors.textMuted }]}>
        Already have an account?{" "}
        <Text
          onPress={() => router.push("/(auth)/signIn")}
          style={{ color: theme.colors.primary, fontWeight: "bold" }}
        >
          Login
        </Text>
      </Text>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  image: {
    // resizeMode is set as prop on Image component
  },
  title: {
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 20,
    marginRight: 20,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 80,
    marginLeft: 20,
    marginRight: 20,
    textAlign: "center",
  },
  button: {
    width: "100%",
    marginTop: "auto",
    maxWidth: 400,
  },
  loginText: {
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 10,
  },
});
