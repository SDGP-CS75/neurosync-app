import React from "react";
import { Text , View, Animated} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Nav from "../../components/Nav";
import { useAppTheme } from "../../context/ThemeContext";
import { useFadeIn, useSlideUp } from "../../utils/animations";

export default function AppLayout() {
    const { theme } = useAppTheme();
    const fadeAnim = useFadeIn(300, 100);
    const slideAnim = useSlideUp(400, 200);
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim.slideAnim }] }}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: theme.colors.primary, fontSize: 20, fontWeight: "bold" }}>Daily Routine</Text>
            </View>
            </Animated.View>
            <Nav />
        </SafeAreaView>
    );
}