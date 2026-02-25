import React from "react";
import { Text , View} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";

export default function AppLayout() {
    const { theme } = useAppTheme();
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: theme.colors.primary, fontSize: 20, fontWeight: "bold" }}>Focus Timer</Text>
            </View>
            <Nav />
        </SafeAreaView>
    );
}