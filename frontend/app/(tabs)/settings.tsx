import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, TextInput, Alert, Image, useWindowDimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Nav from '../../components/Nav';
import { useUser } from '../../context/UserContext';
import { useAppTheme } from '../../context/ThemeContext';
import ThemePicker from '../../components/ThemePicker';
import { logoutUser } from '../../services/auth';
import { resetAllData } from '../../services/reset';
import { Easings } from '../../utils/animations';

const BASE_WIDTH = 390;

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, updateProfile, setProfileImage, resetProfile, saveHapticFeedbackPreference, hapticFeedbackEnabled } = useUser();
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();
  const activeColor = palette.primary;
  
  // Animation values
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const profileCardFade = useRef(new Animated.Value(0)).current;
  const profileCardSlide = useRef(new Animated.Value(30)).current;
  const themeCardFade = useRef(new Animated.Value(0)).current;
  const themeCardSlide = useRef(new Animated.Value(30)).current;
  const prefsCardFade = useRef(new Animated.Value(0)).current;
  const prefsCardSlide = useRef(new Animated.Value(30)).current;
  const accountCardFade = useRef(new Animated.Value(0)).current;
  const accountCardSlide = useRef(new Animated.Value(30)).current;
  
  // Entrance animations
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 300,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 300,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(profileCardFade, {
          toValue: 1,
          duration: 300,
          delay: 50,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(profileCardSlide, {
          toValue: 0,
          duration: 300,
          delay: 50,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(themeCardFade, {
          toValue: 1,
          duration: 300,
          delay: 50,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(themeCardSlide, {
          toValue: 0,
          duration: 300,
          delay: 50,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(prefsCardFade, {
          toValue: 1,
          duration: 300,
          delay: 50,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(prefsCardSlide, {
          toValue: 0,
          duration: 300,
          delay: 50,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(accountCardFade, {
          toValue: 1,
          duration: 300,
          delay: 50,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(accountCardSlide, {
          toValue: 0,
          duration: 300,
          delay: 50,
          easing: Easings.easeOut,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);
  
  // RESPONSIVE SCALING LOGIC
  // Calculates a dynamic scale multiplier based on the device's screen width.
  // This ensures the UI remains consistent across different iOS and Android devices.
  
  const scale = Math.min(width / BASE_WIDTH, 1.3);
  const horizontalPadding = Math.round(24 * scale);
  const cardPadding = Math.round(20 * scale);

  // PROFILE IMAGE HANDLER
  // Launches the native device photo gallery.
  // Enforces a 1:1 aspect ratio crop so the image fits perfectly into the circular avatar UI.
  // Updates the global UserContext upon successful selection.
  const [dailyReminders, setDailyReminders] = useState(true);
  const [strictFocus, setStrictFocus] = useState(false);

  // Function to open the phone gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // SECURE LOGOUT FLOW
  // Triggers a native confirmation modal to prevent accidental logouts.
  // If confirmed, it clears the auth session, resets local profile state, 
  // and redirects the user back to the Welcome/Login screen.
  const handleSave = () => {
    Alert.alert(
      "Settings Saved",
      "Your profile and app preferences have been updated successfully.",
      [{ text: "Awesome!", style: "default" }]
    );
  };

  // Handle Logout
  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
              resetProfile();
              router.replace('/(auth)/welcome');
            } catch (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle Reset All Data
  const handleResetData = async () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your tasks, sessions, and mood analysis data from both this device and the cloud. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await resetAllData();
              if (result.success) {
                Alert.alert(
                  'Data Reset Complete',
                  'All your tasks, sessions, and mood analysis data have been successfully deleted.',
                  [{ text: 'OK', style: 'default' }]
                );
              } else {
                Alert.alert('Error', result.error || 'Failed to reset data. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred while resetting data.');
            }
          },
        },
      ]
    );
  };

 // DYNAMIC STYLESHEET
  // Utilizing the calculated 'scale' multiplier to dynamically adjust padding, 
  // margins, font sizes, and border radii for cross-device compatibility.
  const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    scrollContainer: { paddingHorizontal: horizontalPadding, paddingTop: 8 * scale, paddingBottom: 40 * scale },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 * scale },
    backButton: { width: 40 * scale, height: 40 * scale, backgroundColor: 'white', borderRadius: 20 * scale, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)', elevation: 2 },
    headerTitle: { fontSize: 20 * scale, fontWeight: 'bold', color: '#1F2937' },
    saveButton: { paddingHorizontal: 12 * scale, paddingVertical: 8 * scale },
    saveButtonText: { fontWeight: 'bold', fontSize: 16 * scale },
    card: { backgroundColor: 'white', borderRadius: 24 * scale, padding: cardPadding, marginBottom: 24 * scale, boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.05)', elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
    sectionSubtitle: { fontWeight: 'bold', fontSize: 12 * scale, letterSpacing: 1, marginLeft: 12 * scale, marginBottom: 12 * scale },
    
    profileImageContainer: { alignItems: 'center', marginBottom: 24 * scale, marginTop: 8 * scale },
    profileImage: { width: 100 * scale, height: 100 * scale, borderRadius: 50 * scale, borderWidth: 4 * scale },
    editImageBadge: { position: 'absolute', bottom: 0, right: 0, width: 32 * scale, height: 32 * scale, borderRadius: 16 * scale, justifyContent: 'center', alignItems: 'center', borderWidth: 3 * scale, borderColor: 'white', boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)', elevation: 3 },
    
    inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 * scale, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    inputLabel: { width: 80 * scale, color: '#9CA3AF', fontWeight: '600', fontSize: 14 * scale },
    inputField: { flex: 1, color: '#374151', fontWeight: '500', fontSize: 16 * scale, padding: 0 },
    textArea: { backgroundColor: '#F9FAFB', width: '100%', borderRadius: 12 * scale, padding: 12 * scale, minHeight: 80 * scale, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 8 * scale },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 * scale, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    settingLeft: { flexDirection: 'row', alignItems: 'center' },
    iconWrapper: { width: 32 * scale, height: 32 * scale, borderRadius: 16 * scale, justifyContent: 'center', alignItems: 'center', marginRight: 12 * scale },
    settingText: { color: '#374151', fontWeight: '600', fontSize: 16 * scale },
    settingSubtext: { color: '#9CA3AF', fontSize: 12 * scale, marginTop: 2 },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20 * scale} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
             <Text style={[styles.saveButtonText, { color: activeColor }]}>Save</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* --- USER PROFILE SECTION --- */}
        <Text style={[styles.sectionSubtitle, { color: activeColor }]}>USER PROFILE</Text>
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: profileCardFade,
              transform: [{ translateY: profileCardSlide }],
            },
          ]}
        >
          
          {/* Profile Photo Area */}
          <View style={styles.profileImageContainer}>
            <View>
              {/* Image source now uses the context! */}
              <Image
                source={{ uri: profile.profileImage || 'https://via.placeholder.com/100' }}
                style={[styles.profileImage, { borderColor: activeColor }]} 
              />
              {/* The button now triggers the pickImage function */}
              <TouchableOpacity 
                style={[styles.editImageBadge, { backgroundColor: activeColor }]}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={14 * scale} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Name Input */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput 
              style={styles.inputField} 
              value={profile.name} 
              onChangeText={(text) => updateProfile({ name: text })}
              placeholder="Enter your name"
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput 
              style={styles.inputField} 
              value={profile.email} 
              onChangeText={(text) => updateProfile({ email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Age Input */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput 
              style={styles.inputField} 
              value={profile.age} 
              onChangeText={(text) => updateProfile({ age: text })}
              keyboardType="numeric"
            />
          </View>

          {/* About Input */}
          <View style={[styles.inputRow, { borderBottomWidth: 0, flexDirection: 'column', alignItems: 'flex-start' }]}>
            <Text style={[styles.inputLabel, { marginBottom: 8 * scale }]}>About Me</Text>
            <TextInput 
              style={[styles.inputField, styles.textArea]} 
              value={profile.about} 
              onChangeText={(text) => updateProfile({ about: text })}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

        </Animated.View>

        {/* --- THEME PICKER SECTION --- */}
        <Text style={[styles.sectionSubtitle, { color: activeColor, marginTop: 10 * scale }]}>APP COLOUR THEME</Text>
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: themeCardFade,
              transform: [{ translateY: themeCardSlide }],
            },
          ]}
        >
          <ThemePicker />
        </Animated.View>

        {/* --- PREFERENCES SECTION --- */}
        <Text style={[styles.sectionSubtitle, { color: activeColor, marginTop: 10 * scale }]}>PREFERENCES</Text>
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: prefsCardFade,
              transform: [{ translateY: prefsCardSlide }],
            },
          ]}
        >
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/(tabs)/session-history')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: activeColor + '15' }]}>
                <Ionicons name="time" size={16 * scale} color={activeColor} />
              </View>
              <Text style={styles.settingText}>Session History</Text>
            </View>
            <Ionicons name="chevron-forward" size={18 * scale} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: activeColor + '15' }]}>
                <Ionicons name="notifications" size={16 * scale} color={activeColor} />
              </View>
              <Text style={styles.settingText}>Daily Reminders</Text>
            </View>
            <Switch 
              value={dailyReminders} 
              onValueChange={setDailyReminders}
              trackColor={{ false: "#E5E7EB", true: activeColor + '80' }}
              thumbColor={dailyReminders ? activeColor : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: activeColor + '15' }]}>
                <Ionicons name="phone-portrait" size={16 * scale} color={activeColor} />
              </View>
              <Text style={styles.settingText}>Haptic Feedback</Text>
            </View>
            <Switch 
              value={hapticFeedbackEnabled} 
              onValueChange={saveHapticFeedbackPreference}
              trackColor={{ false: "#E5E7EB", true: activeColor + '80' }}
              thumbColor={hapticFeedbackEnabled ? activeColor : "#f4f3f4"}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="shield-checkmark" size={16 * scale} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.settingText}>Strict Focus Mode</Text>
                <Text style={styles.settingSubtext}>Blocks other apps during focus</Text>
              </View>
            </View>
            <Switch 
              value={strictFocus} 
              onValueChange={setStrictFocus}
              trackColor={{ false: "#E5E7EB", true: "#FECACA" }}
              thumbColor={strictFocus ? "#EF4444" : "#f4f3f4"}
            />
          </View>
        </Animated.View>

        {/* --- ACCOUNT SECTION --- */}
        <Text style={[styles.sectionSubtitle, { color: activeColor, marginTop: 10 * scale }]}>ACCOUNT</Text>
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: accountCardFade,
              transform: [{ translateY: accountCardSlide }],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={handleResetData}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash-outline" size={16 * scale} color="#EF4444" />
              </View>
              <View>
                <Text style={[styles.settingText, { color: '#EF4444' }]}>Reset All Data</Text>
                <Text style={styles.settingSubtext}>Delete all tasks, sessions & mood data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18 * scale} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={16 * scale} color="#EF4444" />
              </View>
              <Text style={[styles.settingText, { color: '#EF4444' }]}>Log Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18 * scale} color="#9CA3AF" />
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
      <Nav />
    </SafeAreaView>
  );
}
