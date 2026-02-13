import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Nav from "../../components/Nav";

export default function Home() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Home Tab</Text>
      <Nav />
    </SafeAreaView>
  );
}
