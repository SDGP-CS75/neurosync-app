import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, TextInput, Alert, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Nav from '../../components/Nav';
import { useUser } from '../../context/UserContext';
import { useAppTheme } from '../../context/ThemeContext';
import ThemePicker from '../../components/ThemePicker';
import { logoutUser } from '../../services/auth';

const BASE_WIDTH = 390;

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, updateProfile, setProfileImage, resetProfile } = useUser();
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();
  const activeColor = palette.primary;
  
  // Responsive scaling
  const scale = Math.min(width / BASE_WIDTH, 1.3);
  const horizontalPadding = Math.round(24 * scale);
  const cardPadding = Math.round(20 * scale);

  // Preference States
  const [dailyReminders, setDailyReminders] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
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

  // Handle Save Button Press
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

  // Dynamic styles
  const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    scrollContainer: { paddingHorizontal: horizontalPadding, paddingTop: 8 * scale, paddingBottom: 40 * scale },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 * scale },
    backButton: { width: 40 * scale, height: 40 * scale, backgroundColor: 'white', borderRadius: 20 * scale, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    headerTitle: { fontSize: 20 * scale, fontWeight: 'bold', color: '#1F2937' },
    saveButton: { paddingHorizontal: 12 * scale, paddingVertical: 8 * scale },
    saveButtonText: { fontWeight: 'bold', fontSize: 16 * scale },
    card: { backgroundColor: 'white', borderRadius: 24 * scale, padding: cardPadding, marginBottom: 24 * scale, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
    sectionSubtitle: { fontWeight: 'bold', fontSize: 12 * scale, letterSpacing: 1, marginLeft: 12 * scale, marginBottom: 12 * scale },
    
    profileImageContainer: { alignItems: 'center', marginBottom: 24 * scale, marginTop: 8 * scale },
    profileImage: { width: 100 * scale, height: 100 * scale, borderRadius: 50 * scale, borderWidth: 4 * scale },
    editImageBadge: { position: 'absolute', bottom: 0, right: 0, width: 32 * scale, height: 32 * scale, borderRadius: 16 * scale, justifyContent: 'center', alignItems: 'center', borderWidth: 3 * scale, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
    
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20 * scale} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
             <Text style={[styles.saveButtonText, { color: activeColor }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* --- USER PROFILE SECTION --- */}
        <Text style={[styles.sectionSubtitle, { color: activeColor }]}>USER PROFILE</Text>
        <View style={styles.card}>
          
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

        </View>

        {/* --- THEME PICKER SECTION --- */}
        <Text style={[styles.sectionSubtitle, { color: activeColor, marginTop: 10 * scale }]}>APP COLOUR THEME</Text>
        <View style={styles.card}>
          <ThemePicker />
        </View>

        {/* --- PREFERENCES SECTION --- */}
        <Text style={[styles.sectionSubtitle, { color: activeColor, marginTop: 10 * scale }]}>PREFERENCES</Text>
        <View style={styles.card}>
          
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
              value={hapticFeedback} 
              onValueChange={setHapticFeedback}
              trackColor={{ false: "#E5E7EB", true: activeColor + '80' }}
              thumbColor={hapticFeedback ? activeColor : "#f4f3f4"}
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
        </View>

        {/* --- ACCOUNT SECTION --- */}
        <Text style={[styles.sectionSubtitle, { color: activeColor, marginTop: 10 * scale }]}>ACCOUNT</Text>
        <View style={styles.card}>
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
        </View>

      </ScrollView>
      <Nav />
    </SafeAreaView>
  );
}
