import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlassCard from '@/components/GlassCard';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  color?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  onPress?: () => void;
  value?: string;
  loading?: boolean;
}

function SettingItem({ icon, label, description, color = Colors.primary, toggle, toggleValue, onToggle, onPress, value, loading }: SettingItemProps) {
  const content = (
    <View style={styles.settingItem}>
      <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: Colors.card, true: Colors.primary + '60' }}
          thumbColor={toggleValue ? Colors.primary : Colors.textMuted}
        />
      ) : value ? (
        <Text style={styles.settingValue}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      )}
    </View>
  );

  if (onPress && !toggle) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Settings state
  const [autoBoost, setAutoBoost] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [lowMemoryBoost, setLowMemoryBoost] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [boostSchedule, setBoostSchedule] = useState('Every 6 hours');
  const [photoQuality, setPhotoQuality] = useState('High');
  const [videoQuality, setVideoQuality] = useState('1080p');
  const [musicRepeat, setMusicRepeat] = useState('Off');
  const [musicShuffle, setMusicShuffle] = useState(false);
  const [memoryThreshold, setMemoryThreshold] = useState('20%');
  const [saving, setSaving] = useState('');

  useEffect(() => {
    loadUserInfo();
    loadSettings();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('user_info');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        setUserName(parsed.name || 'User');
        setUserEmail(parsed.email || '');
      }
    } catch (e) {}
  };

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('app_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setAutoBoost(parsed.autoBoost ?? false);
        setNotifications(parsed.notifications ?? true);
        setLowMemoryBoost(parsed.lowMemoryBoost ?? true);
        setDarkMode(parsed.darkMode ?? true);
        setPhotoQuality(parsed.photoQuality ?? 'High');
        setVideoQuality(parsed.videoQuality ?? '1080p');
        setMusicRepeat(parsed.musicRepeat ?? 'Off');
        setMusicShuffle(parsed.musicShuffle ?? false);
      }
    } catch (e) {}
  };

  const saveSetting = async (key: string, value: any) => {
    setSaving(key);
    try {
      const current = await AsyncStorage.getItem('app_settings');
      const settings = current ? JSON.parse(current) : {};
      settings[key] = value;
      await AsyncStorage.setItem('app_settings', JSON.stringify(settings));
      await new Promise(r => setTimeout(r, 300)); // simulate API call
    } catch (e) {}
    setSaving('');
  };

  const handleToggle = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    await saveSetting(key, value);
  };

  const cycleOption = async (key: string, current: string, options: string[], setter: (v: string) => void) => {
    const idx = options.indexOf(current);
    const next = options[(idx + 1) % options.length];
    setter(next);
    await saveSetting(key, next);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['auth_token', 'user_info', 'app_settings']);
          router.replace('/login');
        },
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'This will clear all cached data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: () => Alert.alert('✅ Cache Cleared', 'All cached data has been removed successfully.'),
      },
    ]);
  };

  const handleResetSettings = () => {
    Alert.alert('Reset Settings', 'This will reset all settings to defaults. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('app_settings');
          setAutoBoost(false);
          setNotifications(true);
          setLowMemoryBoost(true);
          setDarkMode(true);
          setPhotoQuality('High');
          setVideoQuality('1080p');
          setMusicRepeat('Off');
          setMusicShuffle(false);
          Alert.alert('✅ Settings Reset', 'All settings have been reset to defaults.');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Profile Card */}
      <View style={styles.section}>
        <GlassCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>
          <Ionicons name="create-outline" size={20} color={Colors.textMuted} />
        </GlassCard>
      </View>

      {/* General */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GENERAL</Text>
        <GlassCard noPadding>
          <SettingItem icon="moon" label="Dark Mode" description="Keep that sleek cyberpunk look" color={Colors.primary} toggle toggleValue={darkMode} onToggle={v => handleToggle('darkMode', v, setDarkMode)} loading={saving === 'darkMode'} />
          <View style={styles.divider} />
          <SettingItem icon="notifications" label="Notifications" description="Boost reminders & security alerts" color={Colors.secondary} toggle toggleValue={notifications} onToggle={v => handleToggle('notifications', v, setNotifications)} loading={saving === 'notifications'} />
          <View style={styles.divider} />
          <SettingItem icon="language" label="Language" color={Colors.info} value="English" onPress={() => Alert.alert('Language', 'Currently only English is supported.')} />
        </GlassCard>
      </View>

      {/* Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PERFORMANCE</Text>
        <GlassCard noPadding>
          <SettingItem icon="flash" label="Auto Boost" description="Automatically optimize your device" color={Colors.success} toggle toggleValue={autoBoost} onToggle={v => handleToggle('autoBoost', v, setAutoBoost)} loading={saving === 'autoBoost'} />
          <View style={styles.divider} />
          <SettingItem icon="time" label="Boost Schedule" description="How often to auto-optimize" color={Colors.primaryLight} value={boostSchedule} onPress={() => cycleOption('boostSchedule', boostSchedule, ['Every 1 hour', 'Every 3 hours', 'Every 6 hours', 'Every 12 hours', 'Daily'], setBoostSchedule)} />
          <View style={styles.divider} />
          <SettingItem icon="warning" label="Low Memory Boost" description="Auto-boost when RAM is critically low" color={Colors.warning} toggle toggleValue={lowMemoryBoost} onToggle={v => handleToggle('lowMemoryBoost', v, setLowMemoryBoost)} loading={saving === 'lowMemoryBoost'} />
          <View style={styles.divider} />
          <SettingItem icon="speedometer" label="Memory Threshold" description="Trigger boost below this level" color={Colors.accent} value={memoryThreshold} onPress={() => cycleOption('memoryThreshold', memoryThreshold, ['10%', '15%', '20%', '25%', '30%'], setMemoryThreshold)} />
        </GlassCard>
      </View>

      {/* Camera & Media */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CAMERA & MEDIA</Text>
        <GlassCard noPadding>
          <SettingItem icon="camera" label="Photo Quality" description="Higher quality = larger files" color={Colors.secondary} value={photoQuality} onPress={() => cycleOption('photoQuality', photoQuality, ['Low', 'Medium', 'High', 'Maximum'], setPhotoQuality)} />
          <View style={styles.divider} />
          <SettingItem icon="videocam" label="Video Quality" description="Recording resolution" color={Colors.accent} value={videoQuality} onPress={() => cycleOption('videoQuality', videoQuality, ['480p', '720p', '1080p', '4K'], setVideoQuality)} />
          <View style={styles.divider} />
          <SettingItem icon="repeat" label="Music Repeat" description="Repeat mode for playback" color={Colors.primary} value={musicRepeat} onPress={() => cycleOption('musicRepeat', musicRepeat, ['Off', 'One', 'All'], setMusicRepeat)} />
          <View style={styles.divider} />
          <SettingItem icon="shuffle" label="Shuffle" description="Shuffle music playback" color={Colors.success} toggle toggleValue={musicShuffle} onToggle={v => handleToggle('musicShuffle', v, setMusicShuffle)} loading={saving === 'musicShuffle'} />
        </GlassCard>
      </View>

      {/* Data & Storage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DATA & STORAGE</Text>
        <GlassCard noPadding>
          <SettingItem icon="trash" label="Clear Cache" description="Free up storage space" color={Colors.warning} onPress={handleClearCache} />
          <View style={styles.divider} />
          <SettingItem icon="refresh" label="Reset Settings" description="Restore all defaults" color={Colors.accent} onPress={handleResetSettings} />
        </GlassCard>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <GlassCard noPadding>
          <SettingItem icon="information-circle" label="Version" color={Colors.info} value="1.0.0" />
          <View style={styles.divider} />
          <SettingItem icon="code-slash" label="Build" color={Colors.primary} value="2026.04.18" />
          <View style={styles.divider} />
          <SettingItem icon="star" label="Rate App" color={Colors.warning} onPress={() => Alert.alert('⭐ Thank You!', 'Thanks for using ClosingAll! Your support means everything.')} />
          <View style={styles.divider} />
          <SettingItem icon="shield-checkmark" label="Privacy Policy" color={Colors.success} onPress={() => Alert.alert('Privacy', 'Your data stays on your device. We do not collect personal information.')} />
          <View style={styles.divider} />
          <SettingItem icon="document-text" label="Terms of Service" color={Colors.secondary} onPress={() => Alert.alert('Terms', 'By using ClosingAll, you agree to our terms of service.')} />
          <View style={styles.divider} />
          <SettingItem icon="help-circle" label="Help & Support" color={Colors.primaryLight} onPress={() => Alert.alert('Support', 'Contact us at support@closingall.app')} />
        </GlassCard>
      </View>

      {/* Logout */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LinearGradient colors={[Colors.accent + '20', Colors.accent + '10']} style={styles.logoutGradient}>
            <Ionicons name="log-out-outline" size={22} color={Colors.accent} />
            <Text style={styles.logoutText}>Log Out</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionTitle: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 1.5, marginBottom: Spacing.sm, marginLeft: Spacing.xs },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarContainer: { ...Shadows.glow },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: FontSize.xxl, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700' },
  profileEmail: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingInfo: { flex: 1 },
  settingLabel: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' },
  settingDesc: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 1 },
  settingValue: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.glassBorder, marginLeft: 60 },
  logoutBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  logoutGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md + 2, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.accent + '30' },
  logoutText: { color: Colors.accent, fontSize: FontSize.lg, fontWeight: '700' },
});
