import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ImageBackground, StyleSheet, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider} from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <ImageBackground
          source={require("../assets/bg.png")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.content}>
            <StatusBar style="dark" backgroundColor="#7A69AD" />
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
