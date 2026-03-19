import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Nav from '../../components/Nav';

export default function MoodAnalysis() {
  const { colors } = useTheme() as any;
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('mood_entries');
        const arr = raw ? JSON.parse(raw) : [];
        setEntries(arr);
      } catch (e) {
        console.log('Error loading mood entries', e);
      }
    })();
  }, []);

  const screenWidth = Dimensions.get('window').width - 32;

  // Prepare data for chart: use energyLevel over time (latest 12 entries)
  const recent = entries.slice(0, 12).reverse();
  const labels = recent.map((e, i) => new Date(e.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  const data = recent.map(e => Number(e.energyLevel));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.onBackground, marginBottom: 8 }}>Your Mood Analysis</Text>
        <Text style={{ color: colors.textMuted, marginBottom: 20 }}>Overview of recent mood entries (energy level over time)</Text>

        {entries.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>No mood data yet. Add entries via the Mood Tracker.</Text>
        ) : (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
            <LineChart
              data={{ labels: labels, datasets: [{ data: data }] }}
              width={screenWidth}
              height={220}
              chartConfig={{
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                color: (opacity = 1) => `${colors.primary}`,
                labelColor: () => colors.onSurfaceVariant,
                strokeWidth: 2,
                decimalPlaces: 0,
              }}
              bezier
              style={{ borderRadius: 12 }}
            />
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
      <Nav />
    </SafeAreaView>
  );
}
