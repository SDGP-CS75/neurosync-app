import React from "react";
import { Image, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import { buttonTheme, theme } from "../../constants/theme";
import { router } from "expo-router";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  image: {
    width: 450, // width of image
    height: 450, // height of image
    resizeMode: "contain", // fit image inside box without stretching
  },
});

function welcome2() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require("../../assets/welcome/welcome3.png")} // relative path to the image
        style={styles.image}
      />
      <Text
        theme={theme}
        style={{
          fontSize: 25,
          fontWeight: "bold",
          marginBottom: 10,
          marginLeft: 20,
          marginRight: 20,
          textAlign: "center",
        }}
      >
        Quick and Easy
      </Text>

      <Text
        theme={theme}
        style={{
          fontSize: 16,
          color: "#6E6A7C",
          marginBottom: 80,
          marginLeft: 20,
          marginRight: 20,
          textAlign: "center",
        }}
      >
        Short daily exercises that integrate into your life
      </Text>
      <Button
        mode="contained"
        theme={buttonTheme}
        style={{
          paddingVertical: isSmallScreen ? 7 : 10,
          paddingHorizontal: isSmallScreen ? 20 : 30,
          width: "100%",
          marginBottom: isSmallScreen ? 10 : 15,
          maxWidth: 400,
        }}
        onPress={() => router.push("/(auth)/welcome3")}
      >
        Let's Start
      </Button>
      <Text
        style={{
          fontSize: isSmallScreen ? 14 : 16,
          color: theme.colors.otherText,
          textAlign: "center",
          fontWeight: "bold",
          marginTop: 10,
        }}
      >
        Already have an account?{" "}
        <Text
          onPress={() => router.push("/(auth)/sign-in")}
          style={{ color: theme.colors.primary, fontWeight: "bold" }}
        >
          Login
        </Text>
      </Text>
    </SafeAreaView>
  );
}

export default welcome2;
