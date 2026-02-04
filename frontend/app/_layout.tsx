import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ImageBackground, StyleSheet, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        {/* <StatusBar style="dark" backgroundColor="#7A69AD" /> */}
        <SafeAreaView style={{ flex: 1, backgroundColor: "#7A69AD" }} edges={["top"]}>
        <ImageBackground
          source={require("./assets/bg.png")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.content}>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
              }}
            >
              <Stack.Screen
                name="(auth)"
                options={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              />
            </Stack>
          </View>
        </ImageBackground>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
