import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, useWindowDimensions, StyleSheet, Animated } from 'react-native';
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
  
  // Animation values
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(30)).current;
  const inProgressFade = useRef(new Animated.Value(0)).current;
  const inProgressSlide = useRef(new Animated.Value(30)).current;
  const taskGroupsFade = useRef(new Animated.Value(0)).current;
  const taskGroupsSlide = useRef(new Animated.Value(30)).current;
  
  // Responsive scaling
  const scale = Math.min(width / BASE_WIDTH, 1.3);
  const horizontalPadding = Math.round(20 * scale);
  const avatarSize = Math.round(48 * scale);
  const avatarRadius = avatarSize / 2;
  const cardPadding = Math.round(24 * scale);
  const titleFontSize = Math.round(20 * scale);
  const subtitleFontSize = Math.round(14 * scale);

  // Entrance animations
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 170,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(heroFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          useNativeDriver: true,
        }),
        Animated.timing(heroSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(inProgressFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          useNativeDriver: true,
        }),
        Animated.timing(inProgressSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taskGroupsFade, {
          toValue: 1,
          duration: 120,
          delay: 0,
          useNativeDriver: true,
        }),
        Animated.timing(taskGroupsSlide, {
          toValue: 0,
          duration: 120,
          delay: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

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
    notificationBtn: { backgroundColor: 'white', padding: 8 * scale, borderRadius: 20, boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)', elevation: 2 },
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
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
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
        </Animated.View>

        {/* Hero Card */}
        <Animated.View style={[styles.heroCard, { padding: cardPadding, opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
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
        </Animated.View>

        {/* In Progress Section */}
        <Animated.View style={{ opacity: inProgressFade, transform: [{ translateY: inProgressSlide }] }}>
          <SectionTitle title="In Progress" count={6} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inProgressScroll}>
            <InProgressCard
              title="Office Project"
              subtitle="Grocery shopping app design"
              icon={<Ionicons name="briefcase-outline" size={24 * scale} color="#8B5CF6" />}
              bgColor="bg-purple-100"
              progress={0.7}
              progressColor="#8B5CF6"
            />
            <InProgressCard
              title="Personal Project"
              subtitle="Uber Eats redesign challenge"
              icon={<Ionicons name="person-outline" size={24 * scale} color="#F97316" />}
              bgColor="bg-orange-100"
              progress={0.5}
              progressColor="#F97316"
            />
          </ScrollView>
        </Animated.View>

        {/* Task Groups Section */}
        <Animated.View style={[styles.taskGroupsContainer, { opacity: taskGroupsFade, transform: [{ translateY: taskGroupsSlide }] }]}>
          <SectionTitle title="Task Groups" count={4} />
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
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </SafeAreaView>
  );
}
