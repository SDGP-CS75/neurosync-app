import React from 'react';
import { View, TouchableOpacity, useWindowDimensions, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BASE_WIDTH = 390;

export default function BottomNavBar() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  // Responsive scaling based on screen width
  const scale = Math.min(width / BASE_WIDTH, 1.3);
  const horizontalPadding = Math.round(20 * scale);
  const iconSize = Math.round(24 * scale);
  const fabSize = Math.round(56 * scale);
  const fabIconSize = Math.round(28 * scale);
  const buttonPadding = Math.round(12 * scale);
  
  // Calculate bottom safe area
  const bottomPadding = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 12);

  return (
    <View 
      style={[
        styles.container, 
        { 
          paddingHorizontal: horizontalPadding,
          paddingBottom: bottomPadding,
          bottom: bottomPadding,
        }
      ]}
    >
      <TouchableOpacity style={[styles.navButton, { padding: buttonPadding }]}>
        <Ionicons name="home" size={iconSize} color="#8B5CF6" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.navButton, { padding: buttonPadding }]}>
        <Ionicons name="calendar-outline" size={iconSize} color="#9CA3AF" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.fab, 
          { 
            width: fabSize, 
            height: fabSize, 
            borderRadius: fabSize / 2,
            marginTop: -fabSize * 0.4,
          }
        ]}
      >
        <Ionicons name="add" size={fabIconSize} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.navButton, { padding: buttonPadding }]}>
        <Ionicons name="time-outline" size={iconSize} color="#9CA3AF" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.navButton, { padding: buttonPadding }]}>
        <Ionicons name="document-text-outline" size={iconSize} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});