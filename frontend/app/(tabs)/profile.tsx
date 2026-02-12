import { View, Text,  useWindowDimensions, SafeAreaView , ImageBackground} from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { buttonTheme,theme } from '../../constants/theme';

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: isSmallScreen ? 16 : isMediumScreen ? 24 : 32,
        paddingVertical: isSmallScreen ? 16 : 24
      }}>
        <Text style={{ 
          fontSize: isSmallScreen ? 26 : 30, 
          fontWeight: 'bold',
          color: theme.colors.text, 
          textAlign: 'center',
          marginTop: '0.1%',
        }}>
          Welcome to FitHub
        </Text>
        <Text style={{ 
          fontSize: isSmallScreen ? 16 : 18, 
          color: theme.colors.text, 
          textAlign: 'center',
          marginTop: '0.1%',
        }}>
          Your fitness journey starts here
        </Text>
        <Button
          theme={buttonTheme}
          mode="contained"
          onPress={() => router.push('/(auth)/signIn')}
          style={{ marginTop: 20 }}
        >
          Get Started
        </Button>
      </View>
    </SafeAreaView>
  );
}