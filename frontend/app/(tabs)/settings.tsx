import React from "react";
import { Text , View} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";
import ThemePicker from "../../components/ThemePicker";

export default function AppLayout() {
    const { theme } = useAppTheme();
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ alignItems: "center",marginTop: 20 }}>
            <Text style={{ color: theme.colors.primary, fontSize: 20, fontWeight: "bold" }}>Settings</Text>
            </View>
            <ThemePicker />
            <Nav />
        </SafeAreaView>
    );
}