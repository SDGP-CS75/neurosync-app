import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
  const [activeTheme, setActiveTheme] = useState('violet');
  
  const [dailyReminders, setDailyReminders] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [strictFocus, setStrictFocus] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Theme Picker */}
        <View style={styles.card}>
          <Text style={styles.sectionSubtitle}>APP COLOUR THEME</Text>
          <View style={styles.themeRow}>
            {THEMES.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                onPress={() => setActiveTheme(theme.id)}
                style={[
                  styles.themeCircle,
                  { backgroundColor: theme.color },
                  activeTheme === theme.id && styles.activeThemeCircle
                ]}
              >
                {activeTheme === theme.id && <Ionicons name="checkmark" size={20} color="white" />}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.themeLabel}>{THEMES.find(t => t.id === activeTheme)?.label}</Text>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        
        <View style={styles.card}>
          {/* Setting Row */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="notifications" size={16} color="#7C3AED" />
              </View>
              <Text style={styles.settingText}>Daily Reminders</Text>
            </View>
            <Switch 
              value={dailyReminders} 
              onValueChange={setDailyReminders}
              trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
              thumbColor={dailyReminders ? "#7C3AED" : "#f4f3f4"}
            />
          </View>

          {/* Setting Row */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="phone-portrait" size={16} color="#7C3AED" />
              </View>
              <Text style={styles.settingText}>Haptic Feedback</Text>
            </View>
            <Switch 
              value={hapticFeedback} 
              onValueChange={setHapticFeedback}
              trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
              thumbColor={hapticFeedback ? "#7C3AED" : "#f4f3f4"}
            />
          </View>

          {/* Setting Row (No bottom border) */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionSubtitle: {
    color: '#7C3AED',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 20,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  themeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeThemeCircle: {
    borderWidth: 4,
    borderColor: '#E9D5FF',
  },
  themeLabel: {
    color: '#7C3AED',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  settingSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
});