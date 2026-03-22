import { ImageBackground,View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
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
        paddingTop: isSmallScreen ? 50 : isMediumScreen ? 80 : 100
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
          onPress={() => router.push('/(auth)/welcome2')}
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

      </View>
    </ImageBackground>
  );
}