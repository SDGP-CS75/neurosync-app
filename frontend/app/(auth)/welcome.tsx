import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;

  return (
    <View style={{ flex: 1, backgroundColor: '#EAF9E7' }}>
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: isSmallScreen ? 16 : isMediumScreen ? 24 : 32,
        paddingVertical: isSmallScreen ? 16 : 24
      }}>
        <Text style={{ 
          fontSize: isSmallScreen ? 36 : isMediumScreen ? 42 : 48, 
          fontWeight: 'bold', 
          color: '#161F14', 
          marginTop: 40,
          marginBottom: 'auto',
          
          textAlign: 'left'
        }}>
          Welcome to NeuroSync
        </Text>
        <Text style={{ 
          fontSize: isSmallScreen ? 14 : 16, 
          color: '#2F402B', 
          textAlign: 'center', 
          marginBottom: 'auto',
          maxWidth: 400
        }}>
          Boost your productivity with AI-powered features
        </Text>

        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-around', 
          width: '100%', 
          marginBottom: 'auto',
          flexWrap: 'wrap',
          gap: isSmallScreen ? 16 : 24
        }}>
          <View style={{ alignItems: 'center', minWidth: isSmallScreen ? 80 : 90 }}>
            <Text style={{ fontSize: isSmallScreen ? 32 : 40, marginBottom: isSmallScreen ? 6 : 10 }}>📅</Text>
            <Text style={{ fontSize: isSmallScreen ? 12 : 14, color: '#333', fontWeight: '600' }}>Daily Routines</Text>
          </View>
          <View style={{ alignItems: 'center', minWidth: isSmallScreen ? 80 : 90 }}>
            <Text style={{ fontSize: isSmallScreen ? 32 : 40, marginBottom: isSmallScreen ? 6 : 10 }}>⏱️</Text>
            <Text style={{ fontSize: isSmallScreen ? 12 : 14, color: '#333', fontWeight: '600' }}>Focus Timer</Text>
          </View>
          <View style={{ alignItems: 'center', minWidth: isSmallScreen ? 80 : 90 }}>
            <Text style={{ fontSize: isSmallScreen ? 32 : 40, marginBottom: isSmallScreen ? 6 : 10 }}>✅</Text>
            <Text style={{ fontSize: isSmallScreen ? 12 : 14, color: '#333', fontWeight: '600' }}>Todo Lists</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={{ 
            backgroundColor: '#A8D99D', 
            paddingVertical: isSmallScreen ? 12 : 15, 
            paddingHorizontal: isSmallScreen ? 32 : 40, 
            borderRadius: 25, 
            width: '100%', 
            marginTop: 'auto',
            marginBottom: isSmallScreen ? 10 : 15,
            maxWidth: 400
          }}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={{ color: '#161F14', fontSize: isSmallScreen ? 16 : 18, fontWeight: 'bold', textAlign: 'center' }}>
            Get Started
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}
