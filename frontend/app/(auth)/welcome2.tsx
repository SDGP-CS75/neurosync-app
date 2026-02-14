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
        fontSize:     isSmallScreen ? 22 : 25,
        fontWeight:   "bold",
        marginBottom: 10,
        marginLeft:   20,
        marginRight:  20,
        textAlign:    "center",
        color:        theme.colors.onBackground,
      }}>
        Reach your full potential
      </Text>

      <Text style={{
        fontSize:     isSmallScreen ? 14 : 16,
        color:        theme.colors.textMuted,
        marginBottom: 80,
        marginLeft:   20,
        marginRight:  20,
        textAlign:    "center",
      }}>
        Develop new habits and build lifelong skills
      </Text>

      <Button
        mode="contained"
        style={{
          paddingVertical:   isSmallScreen ? 5 : 7,
          paddingHorizontal: isSmallScreen ? 5 : 7,
          width:             "100%",
          marginTop:         "auto",
          marginBottom:      isSmallScreen ? 10 : 15,
          maxWidth:          400,
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