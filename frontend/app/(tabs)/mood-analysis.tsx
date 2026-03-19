import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from 'react-native-paper';
import Nav from '../../components/Nav';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MoodAnalysis() {
  const { colors } = useTheme() as any;
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem('mood_entries');
        const arr = raw ? JSON.parse(raw) : [];
        setEntries(arr);
      } catch (e) {
        console.log('Error loading mood entries', e);
      }
    };
    load();
  }, []);

  // group entries by local date and prepare days array (newest first)
  const days = useMemo(() => {
    const map: Record<string, any[]> = {};
    entries.forEach((e) => {
      const d = new Date(e.timestamp);
      const key = d.toLocaleDateString();
      (map[key] = map[key] || []).push(e);
    });
    const arr = Object.keys(map).map((key) => {
      const items = (map[key] || []).slice().sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      return { dateKey: key, dateObj: new Date(items[0]?.timestamp || Date.now()), items };
    });
    arr.sort((a, b) => Number(b.dateObj) - Number(a.dateObj));
    return arr;
  }, [entries]);

  const selectedDay = days[selectedDayIndex] || (days.length ? days[0] : null);

  // recent entries (latest first). We'll show up to 7 for the chart
  const recent = entries.slice(0, 7);

  // helpers
  const moods = [
    { emoji: '😡', label: 'Terrible' },
    { emoji: '😕', label: 'Off' },
    { emoji: '🙂', label: 'Okay' },
    { emoji: '😊', label: 'Good' },
    { emoji: '😍', label: 'Amazing' },
  ];

  const averageEnergy = entries.length ? Math.round(entries.reduce((s, e) => s + Number(e.energyLevel), 0) / entries.length) : 0;
  const averageMoodIndex = entries.length ? Math.round(entries.reduce((s, e) => s + Number(e.mood), 0) / entries.length) : 3;
  const totalEntries = entries.length;

  // top tag
  const tagCounts: Record<string, number> = {};
  entries.forEach((e) => (e.tags || []).forEach((t: string) => (tagCounts[t] = (tagCounts[t] || 0) + 1)));
  const topTag = Object.keys(tagCounts).sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0))[0] || '—';

  const getMoodLabel = (index: number) => moods[index]?.label || 'Unknown';
  const getMoodEmoji = (index: number) => moods[index]?.emoji || '🙂';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.onBackground }]}>Mood Analysis</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Insights from your recent check-ins</Text>
        </View>

        {/* Analytics summary cards */}
        <View style={styles.analyticsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Avg Energy</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{averageEnergy}/10</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Avg Mood</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{getMoodEmoji(averageMoodIndex)} {getMoodLabel(averageMoodIndex)}</Text>
          </View>
        </View>

        <View style={styles.analyticsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Entries</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{totalEntries}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Top Tag</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{topTag}</Text>
          </View>
        </View>

        {/* Mood chart (custom vertical bars with emoji markers) */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.onBackground }]}>Mood chart</Text>

          <View style={styles.chartInner}>
            {recent.length === 0 ? (
              <Text style={{ color: colors.textMuted }}>No data yet — add moods to see the chart.</Text>
            ) : (
              <View style={styles.chartRow}>
                {recent.slice().reverse().map((e, i) => {
                  const energy = Number(e.energyLevel) || 0; // 0-10
                  const barHeight = Math.max(8, (energy / 10) * 140);
                  const timeLabel = new Date(e.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                  const moodEmoji = getMoodEmoji(Number(e.mood));

                  return (
                    <View key={i} style={styles.chartColumn}>
                      <View style={[styles.bar, { height: barHeight, backgroundColor: colors.primary + '55' }]} />
                      <View style={styles.emojiMarker}><Text style={{ fontSize: 18 }}>{moodEmoji}</Text></View>
                      <Text style={[styles.chartLabel, { color: colors.textMuted }]}>{timeLabel}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Date selector - show per-day pills */}
        {days.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePillsRow}>
              {days.map((d, i) => {
                const label = d.dateObj.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
                const selected = i === selectedDayIndex;
                return (
                  <TouchableOpacity key={d.dateKey} onPress={() => setSelectedDayIndex(i)} style={[styles.datePill, selected && { backgroundColor: colors.primary }]}> 
                    <Text style={{ color: selected ? '#fff' : colors.onBackground, fontWeight: '700' }}>{label}</Text>
                    <Text style={{ color: selected ? '#fff' : colors.textMuted, fontSize: 12 }}>{d.items.length} check-ins</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Entries for selected day (or all recent if none) */}
        <View style={[styles.listCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.onBackground }]}>{selectedDay ? `Check-ins — ${selectedDay.dateKey}` : 'Recent check-ins'}</Text>

          {(!selectedDay || selectedDay.items.length === 0) && entries.length === 0 && (
            <Text style={{ color: colors.textMuted, marginTop: 12 }}>No entries yet.</Text>
          )}

          {(selectedDay ? selectedDay.items : entries.slice(0, 20)).map((e, idx) => (
            <View key={idx} style={styles.entryRow}>
              <View style={[styles.entryEmoji, { backgroundColor: colors.surfaceVariant }]}> 
                <Text style={{ fontSize: 20 }}>{getMoodEmoji(Number(e.mood))}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.onBackground, fontWeight: '600' }}>{getMoodLabel(Number(e.mood))}</Text>
                <Text style={{ color: colors.textMuted, marginTop: 4 }}>{e.note || e.tags?.join(', ') || '—'}</Text>
              </View>
              <Text style={{ color: colors.textMuted }}>{new Date(e.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          ))}

        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Nav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  headerRow: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 6 },
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  statCard: { flex: 1, padding: 12, borderRadius: 12, marginRight: 12 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  chartCard: { marginTop: 16, borderRadius: 12, padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  chartInner: { alignItems: 'center', justifyContent: 'center' },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  chartColumn: { alignItems: 'center', width: (SCREEN_WIDTH - 64) / 7, marginHorizontal: 4 },
  bar: { width: 18, borderRadius: 10, marginBottom: 6 },
  emojiMarker: { marginBottom: 6 },
  chartLabel: { fontSize: 11, marginTop: 6 },
  listCard: { marginTop: 16, borderRadius: 12, padding: 12 },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#00000004' },
  entryEmoji: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  datePillsRow: { paddingVertical: 8, paddingHorizontal: 4 },
  datePill: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginRight: 8, backgroundColor: '#ffffff10', alignItems: 'center', justifyContent: 'center' },
});
