import { ImageBackground,View, Text, useWindowDimensions } from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '../../context/ThemeContext';

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();

  const isSmallScreen  = width < 375;
  const isMediumScreen = width >= 375 && width < 768;
  const isLargeScreen = width >= 768;

  return (
    <ImageBackground 
      source={require('../../images/bgimg.png')} 
      style={{ 
        flex: 1, 
        width: '100%', 
        height: '100%'
      }}>
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: isSmallScreen ? 16 : isMediumScreen ? 24 : 32,
        paddingVertical: isSmallScreen ? 16 : 24,
        paddingTop: isSmallScreen ? 20 : isMediumScreen ? 40 : 60
      }}>
        <ImageBackground 
          source={require('../../images/welcome1.png')} 
          style={{
            width: isSmallScreen ? 300 : isMediumScreen ? 400 : 500,
            height: isSmallScreen ? 300 : isMediumScreen ? 400 : 500,
            marginTop: 0,
            marginBottom: 0
          }}>

        </ImageBackground>
        <Text style={{ 
          fontSize: isSmallScreen ? 28 : isMediumScreen ? 36 : 48, 
          fontWeight: 'bold', 
          color: '#3A3B47', 
          marginTop: 20,
          marginBottom: 15,
          textAlign: 'center',
          paddingHorizontal: 20
        }}>
          Your Calm Focus Companion
        </Text>
        <Text style={{ 
          fontSize: isSmallScreen ? 12 : isMediumScreen ? 14 : 16, 
          color: '#6E6A7C', 
          textAlign: 'center', 
          marginBottom: 20,
          maxWidth: isSmallScreen ? 300 : isMediumScreen ? 350 : 400,
          lineHeight: isSmallScreen ? 18 : 20
        }}>
          Plan tasks, stay present, and move forward at your own pace with a distraction-free productivity experience.
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
            alignSelf:         "center"
          }}
          onPress={() => router.push('/(auth)/welcome2')}
        >
          Let's Start
        </Button>
        <Text style={{
          fontSize:   isSmallScreen ? 14 : 16,
          color:      theme.colors.textMuted,
          textAlign:  "center",
          fontWeight: "bold",
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

      </View>
    </ImageBackground>
  );
}