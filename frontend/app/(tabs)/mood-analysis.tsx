import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from 'react-native-paper';
import Nav from '../../components/Nav';
import { useUser } from '../../context/UserContext';

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

  // control showing only last 3 entries by default
  const [showAllEntries, setShowAllEntries] = useState(false);

  // helpers
  const moods = [
    { emoji: '😡', label: 'Terrible' },
    { emoji: '😕', label: 'Off' },
    { emoji: '🙂', label: 'Okay' },
    { emoji: '😊', label: 'Good' },
    { emoji: '😍', label: 'Amazing' },
  ];

  // compute mood counts for the selected day (or empty) - placed after moods are declared
  const moodCounts = useMemo(() => {
    const counts = Array(moods.length).fill(0);
    const items = selectedDay?.items || [];
    items.forEach((it: any) => {
      const idx = Number(it.mood) || 0;
      if (idx >= 0 && idx < counts.length) counts[idx]++;
    });
    return counts;
  }, [selectedDay, moods.length]);

  const maxCount = Math.max(1, ...moodCounts);

  const averageEnergy = entries.length ? Math.round(entries.reduce((s, e) => s + Number(e.energyLevel), 0) / entries.length) : 0;
  const averageMoodIndex = entries.length ? Math.round(entries.reduce((s, e) => s + Number(e.mood), 0) / entries.length) : 3;
  const totalEntries = entries.length;

  // top tag
  const tagCounts: Record<string, number> = {};
  entries.forEach((e) => (e.tags || []).forEach((t: string) => (tagCounts[t] = (tagCounts[t] || 0) + 1)));
  const topTag = Object.keys(tagCounts).sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0))[0] || '—';

  const getMoodLabel = (index: number) => moods[index]?.label || 'Unknown';
  const getMoodEmoji = (index: number) => moods[index]?.emoji || '🙂';

  // Small computed feedback for the user (uses selected day if available, otherwise overall averages)
  const computeFeedback = () => {
    const useDay = selectedDay && selectedDay.items && selectedDay.items.length > 0;
    const items = useDay ? selectedDay.items : entries;
    const avgMood = items.length ? Math.round(items.reduce((s: number, e: any) => s + Number(e.mood || 3), 0) / items.length) : averageMoodIndex;
    const avgEnergy = items.length ? Math.round(items.reduce((s: number, e: any) => s + Number(e.energyLevel || 5), 0) / items.length) : averageEnergy;

    let title = 'Mood overview';
    const tips: string[] = [];

    if (avgMood <= 1) {
      title = 'Low mood detected';
      tips.push('Try a short walk or breathing exercise (5–10 minutes)');
      tips.push('Reach out to a friend or write down one small win');
    } else if (avgMood === 2) {
      title = 'Feeling a bit low';
      tips.push('Break tasks into small, achievable steps');
      tips.push('Schedule a relaxing activity this evening');
    } else if (avgMood === 3) {
      title = 'Stable';
      tips.push('Keep routines consistent and track what helps');
      tips.push('Try a short energizer (movement, music) if needed');
    } else if (avgMood >= 4) {
      title = 'Feeling good — nice job!';
      tips.push('Celebrate the wins and keep doing what works');
      tips.push('Consider sharing what helped today in notes');
    }

    // energy-specific hint
    if (avgEnergy <= 3) tips.push('Prioritize sleep & small nourishing meals');
    else if (avgEnergy >= 8) tips.push('Use high energy for focused work or creative tasks');

    return { title, tips, avgMood, avgEnergy, useDay };
  };

  const quickFeedback = computeFeedback();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* header with greeting + profile */}
        <View style={[styles.headerRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.onBackground }]}>Hey, {useUser()?.profile?.name?.split(' ')[0] || 'You'}! <Text style={{ fontSize: 20 }}>👋</Text></Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Mood Analysis</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            {useUser()?.profile?.profileImage ? (
              <Image source={{ uri: useUser()?.profile?.profileImage }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitials}>{(useUser()?.profile?.name || 'You').split(' ').map((p: string) => p[0]).slice(0, 2).join('')}</Text>
              </View>
            )}
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>{useUser()?.profile?.name || 'You'}</Text>
          </View>
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

        {/* Today's check-in card (top) */}
        <View style={[styles.todayCard, { backgroundColor: colors.surface }]}> 
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>Today's check-in</Text>
              <Text style={{ color: colors.onBackground, fontWeight: '700', marginTop: 6 }}>Check-in</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>3/3</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>completed</Text>
            </View>
          </View>
        </View>

        {/* Date selector - show per-day pills (moved above chart) */}
        {days.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePillsRow}>
              {days.map((d, i) => {
                const label = d.dateObj.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
                const selected = i === selectedDayIndex;
                return (
                  <TouchableOpacity key={d.dateKey} onPress={() => { setSelectedDayIndex(i); setShowAllEntries(false); }} style={[styles.datePill, selected && { backgroundColor: colors.primary }]}> 
                    <Text style={{ color: selected ? '#fff' : colors.onBackground, fontWeight: '700' }}>{label}</Text>
                    <Text style={{ color: selected ? '#fff' : colors.textMuted, fontSize: 12 }}>{d.items.length} check-ins</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Mood chart (counts per emoji for selected day) */}
        <View style={[styles.chartWrap, { backgroundColor: colors.surface }]}> 
          <Text style={[styles.cardTitle, { color: colors.onBackground }]}>Mood chart</Text>

          <View style={[styles.chartBg]}> 
            <View style={[styles.chartInner, { paddingVertical: 12 }] }>
              {(!selectedDay || (selectedDay.items || []).length === 0) ? (
                <Text style={{ color: colors.textMuted }}>No data for this day — add moods to see the chart.</Text>
              ) : (
                <View style={[styles.chartRow, { alignItems: 'flex-end' }]}>
                  {moods.map((m, idx) => {
                    const count = moodCounts[idx] || 0;
                    const height = (count / maxCount) * 140; // scale
                    return (
                      <View key={idx} style={styles.chartColumn}>
                        <View style={{ height: Math.max(6, height), width: 22, borderRadius: 12, backgroundColor: colors.primary + '66', marginBottom: 8 }} />
                        <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
                        <Text style={[styles.chartLabel, { color: colors.textMuted }]}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Entries for selected day (or all recent if none) */}
        <View style={[styles.listCard, { backgroundColor: colors.surface }]}> 
          <Text style={[styles.cardTitle, { color: colors.onBackground }]}>{selectedDay ? `Check-ins — ${selectedDay.dateKey}` : 'Recent check-ins'}</Text>

          {(!selectedDay || selectedDay.items.length === 0) && entries.length === 0 && (
            <Text style={{ color: colors.textMuted, marginTop: 12 }}>No entries yet.</Text>
          )}

          {(selectedDay ? (showAllEntries ? selectedDay.items : selectedDay.items.slice(0, 3)) : (entries.slice(0, 20))).map((e, idx) => (
            <View key={idx} style={[styles.entryCard, { backgroundColor: colors.background }]}> 
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.entryEmoji, { backgroundColor: colors.surfaceVariant }]}> 
                  <Text style={{ fontSize: 20 }}>{getMoodEmoji(Number(e.mood))}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.entryTitle, { color: colors.onBackground }]}>{getMoodLabel(Number(e.mood))}</Text>
                  <Text style={[styles.entrySubtitle, { color: colors.textMuted }]}>{e.note || e.tags?.join(', ') || '—'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.textMuted }}>{new Date(e.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text style={{ color: colors.primary, marginTop: 6 }}>Edit</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Show more / Show less */}
          {selectedDay && selectedDay.items.length > 3 && (
            <TouchableOpacity onPress={() => setShowAllEntries((s) => !s)} style={[styles.showMoreBtn, { borderColor: colors.primary }]}> 
              <Text style={{ color: colors.primary }}>{showAllEntries ? 'Show less' : `Show more (${selectedDay.items.length - 3})`}</Text>
            </TouchableOpacity>
          )}

        </View>

        {/* Quick feedback summary at the end */}
        <View style={[styles.feedbackSummary, { backgroundColor: colors.surface }]}> 
          <Text style={[styles.cardTitle, { color: colors.onBackground }]}>Quick feedback</Text>
          <Text style={{ color: colors.onBackground, fontWeight: '700' }}>{quickFeedback.title}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 8 }}>Avg mood: {quickFeedback.avgMood} • Avg energy: {quickFeedback.avgEnergy}</Text>
          <View style={{ marginTop: 10 }}>
            {quickFeedback.tips.map((t, i) => (
              <Text key={i} style={{ color: colors.textMuted, marginTop: 6 }}>{'•  '}{t}</Text>
            ))}
          </View>
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
  todayCard: { marginTop: 12, padding: 12, borderRadius: 12 },
  chartWrap: { marginTop: 16, borderRadius: 12, padding: 12 },
  chartBg: { marginTop: 8, borderRadius: 12, padding: 16, backgroundColor: '#f3eefe' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  chartInner: { alignItems: 'center', justifyContent: 'center' },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  chartColumn: { alignItems: 'center', width: (SCREEN_WIDTH - 64) / 7, marginHorizontal: 4 },
  bar: { width: 18, borderRadius: 10, marginBottom: 6 },
  emojiMarker: { marginBottom: 6 },
  chartLabel: { fontSize: 11, marginTop: 6 },
  listCard: { marginTop: 16, borderRadius: 12, padding: 12 },
  entryCard: { marginTop: 8, padding: 12, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#00000004' },
  entryEmoji: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  entryTitle: { fontWeight: '700' },
  entrySubtitle: { marginTop: 4 },
  datePillsRow: { paddingVertical: 8, paddingHorizontal: 4 },
  datePill: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginRight: 8, backgroundColor: '#ffffff10', alignItems: 'center', justifyContent: 'center' },
  countBadge: { marginTop: 6, fontSize: 12, fontWeight: '700' },
  showMoreBtn: { marginTop: 12, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  greeting: { fontSize: 20, fontWeight: '700' },
  headerAvatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontWeight: '700' },
  feedbackSummary: { marginTop: 16, borderRadius: 12, padding: 12 },
});
