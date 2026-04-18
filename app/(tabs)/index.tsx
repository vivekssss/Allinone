import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import GlassCard from '@/components/GlassCard';
import StatCard from '@/components/StatCard';
import GradientButton from '@/components/GradientButton';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [deviceName, setDeviceName] = useState('');
  const [performanceScore, setPerformanceScore] = useState(78);

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const battery = await Battery.getBatteryLevelAsync();
      setBatteryLevel(Math.round(battery * 100));
      setDeviceName(Device.modelName || Device.deviceName || 'Your Device');
    } catch (e) {
      console.log('Device info error:', e);
    }
  };

  const quickActions = [
    { icon: 'rocket' as const, label: 'Boost Now', color: Colors.accent, screen: '/security' },
    { icon: 'camera' as const, label: 'Camera', color: Colors.secondary, screen: '/camera' },
    { icon: 'musical-notes' as const, label: 'Play Music', color: Colors.primary, screen: '/media' },
    { icon: 'analytics' as const, label: 'CPU Stats', color: Colors.success, screen: '/performance' },
  ];

  const recentActivity = [
    { icon: 'rocket', text: 'Boosted - 3 apps closed', time: '2 min ago', color: Colors.accent },
    { icon: 'camera', text: 'Photo captured', time: '15 min ago', color: Colors.secondary },
    { icon: 'musical-notes', text: 'Played "Starlight"', time: '1 hr ago', color: Colors.primary },
    { icon: 'analytics', text: 'CPU snapshot saved', time: '3 hrs ago', color: Colors.success },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary + '30', Colors.background]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.deviceName}>{deviceName}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Performance Score Hero */}
        <GlassCard style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreRing}>
                <Text style={styles.scoreText}>{performanceScore}</Text>
                <Text style={styles.scoreLabel}>Score</Text>
              </View>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroTitle}>Device Health</Text>
              <Text style={styles.heroSubtitle}>
                {performanceScore >= 80
                  ? '🟢 Excellent condition'
                  : performanceScore >= 50
                  ? '🟡 Could be better'
                  : '🔴 Needs optimization'}
              </Text>
              <GradientButton
                title="Optimize Now"
                onPress={() => router.push('/security')}
                size="sm"
                icon={<Ionicons name="rocket" size={16} color="#fff" />}
                style={{ marginTop: Spacing.md }}
              />
            </View>
          </View>
        </GlassCard>
      </LinearGradient>

      {/* Quick Stats Row */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="battery-charging"
            label="Battery"
            value={`${batteryLevel}%`}
            color={batteryLevel > 50 ? Colors.success : Colors.warning}
            percentage={batteryLevel}
          />
          <StatCard
            icon="hardware-chip"
            label="CPU"
            value="32%"
            color={Colors.secondary}
            percentage={32}
          />
        </View>
        <View style={[styles.statsRow, { marginTop: Spacing.md }]}>
          <StatCard
            icon="server"
            label="RAM"
            value="2.4 GB"
            subValue="of 6 GB"
            color={Colors.primary}
            percentage={40}
          />
          <StatCard
            icon="folder"
            label="Storage"
            value="48 GB"
            subValue="of 128 GB"
            color={Colors.warning}
            percentage={37}
          />
        </View>
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => router.push(action.screen as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={[styles.section, { marginBottom: 100 }]}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <GlassCard noPadding>
          {recentActivity.map((activity, index) => (
            <View
              key={index}
              style={[
                styles.activityItem,
                index < recentActivity.length - 1 && styles.activityBorder,
              ]}
            >
              <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                <Ionicons name={activity.icon as any} size={18} color={activity.color} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityText}>{activity.text}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  deviceName: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginTop: 2,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  heroCard: {
    marginTop: Spacing.sm,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    ...Shadows.glow,
  },
  scoreText: {
    color: Colors.textPrimary,
    fontSize: FontSize.title,
    fontWeight: '900',
  },
  scoreLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2 - 0.5,
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  activityTime: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
});
