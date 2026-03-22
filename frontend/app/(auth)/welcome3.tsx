import React from "react";
import { Image, StyleSheet, useWindowDimensions, TouchableOpacity, View } from "react-native";
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
    width:      450,
    height:     450,
    resizeMode: "contain",
  },
});

// ⚠️ Fixed: was exported as `welcome2` — renamed to `Welcome3`
export default function Welcome3() {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();

  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;
  const isLargeScreen = width >= 768;

  return (
    <SafeAreaView style={styles.container}>

      <Image
        source={require("../../assets/welcome/welcome3.png")}
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
        Quick and Easy
      </Text>

      <Text style={{
        fontSize:     isSmallScreen ? 14 : 16,
        color:        theme.colors.textMuted,
        marginBottom: 80,
        marginLeft:   20,
        marginRight:  20,
        textAlign:    "center",
      }}>
        Short daily exercises that integrate into your life
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        style={{ 
          backgroundColor: '#7A69AD', 
          paddingVertical: isSmallScreen ? 12 : isMediumScreen ? 15 : 18, 
          paddingHorizontal: isSmallScreen ? 24 : isMediumScreen ? 32 : 40, 
          borderRadius: 12, 
          width: '100%', 
          marginTop: 'auto',
          marginBottom: isSmallScreen ? 15 : isMediumScreen ? 20 : 25,
          maxWidth: isSmallScreen ? 250 : isMediumScreen ? 300 : 350,
          alignSelf: 'center'
        }}
        onPress={() => router.push('/(auth)/signIn')}
      >
        <Text style={{ 
          color: '#ffffff', 
          fontSize: isSmallScreen ? 14 : isMediumScreen ? 16 : 18, 
          fontWeight: 'bold', 
          textAlign: 'center',
          paddingHorizontal: 10
        }}>
          Let's Start 
        </Text>
      </TouchableOpacity>

      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: isSmallScreen ? 20 : isMediumScreen ? 25 : 30,
        width: '100%',
        paddingHorizontal: 20
      }}>
        <Text style={{ 
          fontSize: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
          color: '#6E6A7C'
        }}>
          Already have an account?{" "}
          <Text style={{ 
            color: '#7A69AD', 
            fontWeight: 'bold',
            fontSize: isSmallScreen ? 12 : isMediumScreen ? 14 : 16
          }} 
          onPress={() => router.push('/(auth)/signIn')}>
             Login
          </Text>
        </Text>
      </View>

    </SafeAreaView>
  );
}