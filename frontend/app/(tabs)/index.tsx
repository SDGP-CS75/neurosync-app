import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, useWindowDimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CircularProgress from 'react-native-circular-progress-indicator';
import { useRouter } from 'expo-router';

// Import your components
import SectionTitle from '../../components/SectionTitle';
import InProgressCard from '../../components/InProgressCard';
import TaskGroupCard from '../../components/TaskGroupCard';
import BottomNavBar from '../../components/BottomNavBar';
import { useUser } from '../../context/UserContext';

const BASE_WIDTH = 390;

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const { width } = useWindowDimensions();
  
  // Responsive scaling
  const scale = Math.min(width / BASE_WIDTH, 1.3);
  const horizontalPadding = Math.round(20 * scale);
  const avatarSize = Math.round(48 * scale);
  const avatarRadius = avatarSize / 2;
  const cardPadding = Math.round(24 * scale);
  const titleFontSize = Math.round(20 * scale);
  const subtitleFontSize = Math.round(14 * scale);

  // Styles
  const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingTop: 8, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 * scale },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    greetingContainer: { marginLeft: 12 * scale },
    greetingText: { color: '#6B7280' },
    userNameText: { fontWeight: 'bold', color: '#1F2937' },
    notificationBtn: { backgroundColor: 'white', padding: 8 * scale, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    heroCard: { backgroundColor: '#8B5CF6', borderRadius: 24 * scale, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 * scale },
    heroContent: { flex: 1, paddingRight: 16 * scale },
    heroTitle: { color: 'white', fontWeight: 'bold', marginBottom: 16 * scale, lineHeight: 28 * scale },
    heroButton: { backgroundColor: 'white', paddingVertical: 12 * scale, paddingHorizontal: 24 * scale, borderRadius: 12 * scale, alignSelf: 'flex-start' },
    heroButtonText: { color: '#8B5CF6', fontWeight: '600', fontSize: 14 * scale },
    heroRight: { alignItems: 'center' },
    heroMenuBtn: { alignSelf: 'flex-end', marginBottom: 8 * scale },
    inProgressScroll: { marginBottom: 24 * scale },
    taskGroupsContainer: { marginBottom: 96 },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]} showsVerticalScrollIndicator={false}>
        
        {/* Header - Clickable routing to Profile */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerLeft}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            {/* Profile image from user context */}
            <Image
              source={{ uri: profile.profileImage || 'https://via.placeholder.com/48' }}
              style={{ width: avatarSize, height: avatarSize, borderRadius: avatarRadius }}
            />
            <View style={styles.greetingContainer}>
              <Text style={[styles.greetingText, { fontSize: subtitleFontSize }]}>Hello!</Text>
              <Text style={[styles.userNameText, { fontSize: titleFontSize }]}>{profile.name || 'User'}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24 * scale} color="black" />
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, { padding: cardPadding }]}>
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { fontSize: titleFontSize }]}>
              Your today's task{'\n'}almost done!
            </Text>
            <TouchableOpacity style={styles.heroButton}>
              <Text style={styles.heroButtonText}>View Task</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroRight}>
            <TouchableOpacity style={styles.heroMenuBtn}>
              <Ionicons name="ellipsis-horizontal" size={24 * scale} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
            <CircularProgress
              value={85}
              radius={45 * scale}
              duration={1500}
              progressValueColor={'#fff'}
              activeStrokeColor={'#fff'}
              inActiveStrokeColor={'rgba(255,255,255,0.2)'}
              activeStrokeWidth={8 * scale}
              inActiveStrokeWidth={8 * scale}
              valueSuffix={'%'}
              titleStyle={{ fontWeight: 'bold', fontSize: 14 * scale }}
            />
          </View>
        </View>

        {/* In Progress Section */}
        <SectionTitle title="In Progress" count={6} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inProgressScroll}>
          <InProgressCard
            title="Office Project"
            subtitle="Grocery shopping app design"
            bgColor="bg-[#E8F0F6]"
            progress={0.7}
            progressColor="#3B82F6"
          />
          <InProgressCard
            title="Personal Project"
            subtitle="Uber Eats redesign challenge"
            bgColor="bg-[#F6EBE5]"
            progress={0.5}
            progressColor="#EA580C"
          />
        </ScrollView>

        {/* Task Groups Section */}
        <SectionTitle title="Task Groups" count={5} />
        <View style={styles.taskGroupsContainer}>
          <TaskGroupCard
            title="Office Project"
            tasks={23}
            progress={70}
            icon={<Ionicons name="briefcase" size={24 * scale} color="#4B5563" />}
            iconBgColor="bg-[#FCEEF5]"
            progressColor="#E84088"
          />
          <TaskGroupCard
            title="Office Project"
            tasks={30}
            progress={70}
            icon={<Ionicons name="lock-closed" size={24 * scale} color="#4B5563" />}
            iconBgColor="bg-[#ECEEFA]"
            progressColor="#7B37F4"
          />
          <TaskGroupCard
            title="Daily Study"
            tasks={50}
            progress={87}
            icon={<Ionicons name="book" size={24 * scale} color="#4B5563" />}
            iconBgColor="bg-[#FDF1DC]"
            progressColor="#EA580C"
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </SafeAreaView>
  );
}
