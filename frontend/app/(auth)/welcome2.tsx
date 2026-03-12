import React from "react";
import { Image, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import { router } from "expo-router";
import { useAppTheme } from "../../context/ThemeContext";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  image: {
    width:       450,
    height:      450,
    resizeMode:  "contain",
  },
});

export default function Welcome2() {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();

  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;

  return (
    <SafeAreaView style={styles.container}>

      <Image
        source={require("../../assets/welcome/welcome2.png")}
        style={[
          styles.image,
          {
            width:  isSmallScreen ? 300 : 450,
            height: isSmallScreen ? 300 : 450,
          },
        ]}
      />

      <Text style={{
        fontSize:     isSmallScreen ? 28 : isMediumScreen ? 36 : 48,
        fontWeight:   "bold",
        marginBottom: 15,
        marginLeft:   20,
        marginRight:  20,
        textAlign:    "center",
        color:        '#3A3B47',
      }}>
        Reach your full potential
      </Text>

      <Text style={{
        fontSize:     isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
        color:        '#6E6A7C',
        marginBottom: 40,
        marginLeft:   20,
        marginRight:  20,
        textAlign:    "center",
        lineHeight:   isSmallScreen ? 18 : 20,
        maxWidth:     isSmallScreen ? 300 : isMediumScreen ? 350 : 400,
      }}>
        Develop new habits and build lifelong skills
      </Text>

      <Button
        mode="contained"
        style={{
          paddingVertical:   isSmallScreen ? 3 : 5,
          paddingHorizontal: isSmallScreen ? 3 : 5,
          width:             "85%",
          marginTop:         "auto",
          marginBottom:      isSmallScreen ? 10 : 15,
          maxWidth:          320,
        }}
        onPress={() => router.push("/(auth)/welcome3")}
      >
        Let's Start
      </Button>

      <Text style={{
        fontSize:   isSmallScreen ? 14 : 16,
        color:      theme.colors.textMuted,
        textAlign:  "center",
        fontWeight: "bold",
        marginTop:  10,
        marginBottom: isSmallScreen ? 30 : isMediumScreen ? 40 : 50,
      }}>
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