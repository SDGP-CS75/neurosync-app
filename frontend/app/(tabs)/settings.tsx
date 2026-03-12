import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Nav from '../../components/Nav';
import { useUser } from '../../context/UserContext'; 

const THEMES = [
  { id: 'violet', color: '#7C3AED', label: 'Violet' },
  { id: 'blue', color: '#3B82F6', label: 'Blue' },
  { id: 'green', color: '#10B981', label: 'Green' },
  { id: 'pink', color: '#EC4899', label: 'Pink' },
  { id: 'orange', color: '#F59E0B', label: 'Orange' },
  { id: 'gray', color: '#6B7280', label: 'Gray' },
  { id: 'teal', color: '#14B8A6', label: 'Teal' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, updateProfile, setProfileImage } = useUser();
  
  // Theme State
  const [activeTheme, setActiveTheme] = useState('violet');
  const activeColor = THEMES.find(t => t.id === activeTheme)?.color || '#7C3AED';

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
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
                source={{ uri: profile.profileImage }}
                style={[styles.profileImage, { borderColor: activeColor }]} 
              />
              {/* The button now triggers the pickImage function */}
              <TouchableOpacity 
                style={[styles.editImageBadge, { backgroundColor: activeColor }]}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={14} color="white" />
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
            <Text style={[styles.inputLabel, { marginBottom: 8 }]}>About Me</Text>
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
        <Text style={[styles.sectionSubtitle, { color: activeColor, marginTop: 10 }]}>APP COLOUR THEME</Text>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            {THEMES.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                onPress={() => setActiveTheme(theme.id)}
                style={[
                  styles.themeCircle,
                  { backgroundColor: theme.color },
                  activeTheme === theme.id && { borderWidth: 4, borderColor: theme.color + '40' }
                ]}
              >
                {activeTheme === theme.id && <Ionicons name="checkmark" size={20} color="white" />}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.themeLabel, { color: activeColor }]}>
            {THEMES.find(t => t.id === activeTheme)?.label}
          </Text>
        </View>

        {/* --- PREFERENCES SECTION --- */}
        <Text style={[styles.sectionSubtitle, { color: activeColor, marginTop: 10 }]}>PREFERENCES</Text>
        <View style={styles.card}>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: activeColor + '15' }]}>
                <Ionicons name="notifications" size={16} color={activeColor} />
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
                <Ionicons name="phone-portrait" size={16} color={activeColor} />
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
                <Ionicons name="shield-checkmark" size={16} color="#EF4444" />
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

      </ScrollView>
      <Nav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContainer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  backButton: { width: 40, height: 40, backgroundColor: 'white', borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  saveButton: { paddingHorizontal: 12, paddingVertical: 8 },
  saveButtonText: { fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  sectionSubtitle: { fontWeight: 'bold', fontSize: 12, letterSpacing: 1, marginLeft: 12, marginBottom: 12 },
  
  profileImageContainer: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4 },
  editImageBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  inputLabel: { width: 80, color: '#9CA3AF', fontWeight: '600', fontSize: 14 },
  inputField: { flex: 1, color: '#374151', fontWeight: '500', fontSize: 16, padding: 0 },
  textArea: { backgroundColor: '#F9FAFB', width: '100%', borderRadius: 12, padding: 12, minHeight: 80, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 8 },
  themeRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 },
  themeCircle: { width: 44, height: 44, borderRadius: 22, margin: 6, alignItems: 'center', justifyContent: 'center' },
  themeLabel: { fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingText: { color: '#374151', fontWeight: '600', fontSize: 16 },
  settingSubtext: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
});