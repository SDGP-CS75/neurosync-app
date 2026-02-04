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
        <View style={{ marginBottom: '0.5%', justifyContent: 'center', alignItems: 'center' ,marginTop: '10%'}}>
          <ImageBackground
            source={require('../../assets/welcome1.png')}
            style={{ 
              width: isSmallScreen ? 350 : isMediumScreen ? 500 : 600, 
              height: isSmallScreen ? 350 : isMediumScreen ? 500 : 600,
              alignItems: 'center',
            }}
          />
        </View>
        <Text style={{ 
          fontSize: isSmallScreen ? 26 : 30, 
          fontWeight: 'bold',
          color: theme.colors.text, 
          textAlign: 'center',
          marginTop: '0.1%',
          marginBottom: 15
        }}>
          Your Calm Focus Companion
        </Text>
        <Text style={{ 
          fontSize: isSmallScreen ? 12 : 14, 
          color: theme.colors.otherText,
          textAlign: 'center', 
          marginLeft: '5%', 
          marginRight: '5%',
          marginBottom: 'auto',
          maxWidth: 400
        }}>
          Plan tasks, stay present, and move forward 
          at your own pace with a distraction-free productivity experience.
        </Text>

        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-around', 
          width: '100%', 
          marginBottom: 'auto',
          flexWrap: 'wrap',
          gap: isSmallScreen ? 16 : 24
        }}>
        </View>

        <Button
          mode="contained"
          theme={buttonTheme}
          style={{
            paddingVertical: isSmallScreen ? 5 : 7,
            paddingHorizontal: isSmallScreen ? 5: 7,
            width: '100%',
            marginTop: 'auto',
            marginBottom: isSmallScreen ? 10 : 15,
            maxWidth: 400,
          }}
          onPress={() => router.push('/(auth)/welcome2')}
        >
          Let's Start
        </Button>

        <Text style={{ 
          fontSize: isSmallScreen ? 14 : 16, 
          color: theme.colors.otherText,
          textAlign: 'center',
          fontWeight: 'bold',
          marginTop: 10
        }}>
          Already have an account? <Text 
          onPress={() => router.push('/(auth)/sign-in')} style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Login</Text>
        </Text>

      </View>
    </SafeAreaView>
  );
}
