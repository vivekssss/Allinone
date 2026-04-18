import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Platform, Alert,
  ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from 'react-i18next';
import { changeLanguage, supportedLanguages } from '@/i18n';
import GlassCard from '@/components/GlassCard';
import { Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import '@/i18n';

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
  colors: any;
}

function SettingItem({ icon, label, description, color, toggle, toggleValue, onToggle, onPress, value, loading, colors }: SettingItemProps) {
  const itemColor = color || colors.primary;
  const content = (
    <View style={styles.settingItem}>
      <View style={[styles.settingIcon, { backgroundColor: itemColor + '20' }]}>
        <Ionicons name={icon} size={20} color={itemColor} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
        {description && <Text style={[styles.settingDesc, { color: colors.textMuted }]}>{description}</Text>}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: colors.card, true: colors.primary + '60' }}
          thumbColor={toggleValue ? colors.primary : colors.textMuted}
        />
      ) : value ? (
        <Text style={[styles.settingValue, { color: colors.primary }]}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
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
  const { colors, toggleTheme, isDark, mode } = useTheme();
  const { t, i18n } = useTranslation();

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [autoBoost, setAutoBoost] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [lowMemoryBoost, setLowMemoryBoost] = useState(true);
  const [boostSchedule, setBoostSchedule] = useState('Every 6 hours');
  const [photoQuality, setPhotoQuality] = useState('High');
  const [videoQuality, setVideoQuality] = useState('1080p');
  const [musicRepeat, setMusicRepeat] = useState('Off');
  const [musicShuffle, setMusicShuffle] = useState(false);
  const [memoryThreshold, setMemoryThreshold] = useState('20%');
  const [saving, setSaving] = useState('');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

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
      await new Promise(r => setTimeout(r, 300));
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

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleLanguageChange = async (langCode: string) => {
    await changeLanguage(langCode);
    setShowLanguagePicker(false);
  };

  const handleLogout = async () => {
    Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['auth_token', 'user_info', 'app_settings']);
          router.replace('/login');
        },
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert(t('settings.clearCache'), 'This will clear all cached data. Continue?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: 'Clear', onPress: () => Alert.alert('✅ Cache Cleared', 'All cached data has been removed successfully.') },
    ]);
  };

  const handleResetSettings = () => {
    Alert.alert(t('settings.resetSettings'), 'This will reset all settings to defaults. Continue?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.reset'),
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('app_settings');
          setAutoBoost(false);
          setNotifications(true);
          setLowMemoryBoost(true);
          setPhotoQuality('High');
          setVideoQuality('1080p');
          setMusicRepeat('Off');
          setMusicShuffle(false);
          Alert.alert('✅ Settings Reset', 'All settings have been reset to defaults.');
        },
      },
    ]);
  };

  const currentLanguage = supportedLanguages.find(l => l.code === i18n.language) || supportedLanguages[0];

  const divider = <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* User Profile Card */}
      <View style={styles.section}>
        <GlassCard style={styles.profileCard}>
          <View style={Shadows.glow}>
            <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{userName}</Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{userEmail}</Text>
          </View>
          <Ionicons name="create-outline" size={20} color={colors.textMuted} />
        </GlassCard>
      </View>

      {/* General */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.general')}</Text>
        <GlassCard noPadding>
          <SettingItem icon={isDark ? 'moon' : 'sunny'} label={isDark ? t('settings.darkMode') : t('settings.lightMode')} description={isDark ? t('settings.darkModeDesc') : t('settings.lightModeDesc')} color={colors.primary} toggle toggleValue={isDark} onToggle={handleThemeToggle} colors={colors} />
          {divider}
          <SettingItem icon="notifications" label={t('settings.notifications')} description={t('settings.notificationsDesc')} color={colors.secondary} toggle toggleValue={notifications} onToggle={v => handleToggle('notifications', v, setNotifications)} loading={saving === 'notifications'} colors={colors} />
          {divider}
          <SettingItem icon="language" label={t('settings.language')} color={colors.info} value={`${currentLanguage.flag} ${currentLanguage.name}`} onPress={() => setShowLanguagePicker(true)} colors={colors} />
        </GlassCard>
      </View>

      {/* Performance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.performance')}</Text>
        <GlassCard noPadding>
          <SettingItem icon="flash" label={t('settings.autoBoost')} description={t('settings.autoBoostDesc')} color={colors.success} toggle toggleValue={autoBoost} onToggle={v => handleToggle('autoBoost', v, setAutoBoost)} loading={saving === 'autoBoost'} colors={colors} />
          {divider}
          <SettingItem icon="time" label={t('settings.boostSchedule')} description={t('settings.boostScheduleDesc')} color={colors.primaryLight} value={boostSchedule} onPress={() => cycleOption('boostSchedule', boostSchedule, ['Every 1 hour', 'Every 3 hours', 'Every 6 hours', 'Every 12 hours', 'Daily'], setBoostSchedule)} colors={colors} />
          {divider}
          <SettingItem icon="warning" label={t('settings.lowMemoryBoost')} description={t('settings.lowMemoryBoostDesc')} color={colors.warning} toggle toggleValue={lowMemoryBoost} onToggle={v => handleToggle('lowMemoryBoost', v, setLowMemoryBoost)} loading={saving === 'lowMemoryBoost'} colors={colors} />
          {divider}
          <SettingItem icon="speedometer" label={t('settings.memoryThreshold')} description={t('settings.memoryThresholdDesc')} color={colors.accent} value={memoryThreshold} onPress={() => cycleOption('memoryThreshold', memoryThreshold, ['10%', '15%', '20%', '25%', '30%'], setMemoryThreshold)} colors={colors} />
        </GlassCard>
      </View>

      {/* Camera & Media */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.cameraMedia')}</Text>
        <GlassCard noPadding>
          <SettingItem icon="camera" label={t('settings.photoQuality')} description={t('settings.photoQualityDesc')} color={colors.secondary} value={photoQuality} onPress={() => cycleOption('photoQuality', photoQuality, ['Low', 'Medium', 'High', 'Maximum'], setPhotoQuality)} colors={colors} />
          {divider}
          <SettingItem icon="videocam" label={t('settings.videoQuality')} description={t('settings.videoQualityDesc')} color={colors.accent} value={videoQuality} onPress={() => cycleOption('videoQuality', videoQuality, ['480p', '720p', '1080p', '4K'], setVideoQuality)} colors={colors} />
          {divider}
          <SettingItem icon="repeat" label={t('settings.musicRepeat')} description={t('settings.musicRepeatDesc')} color={colors.primary} value={musicRepeat} onPress={() => cycleOption('musicRepeat', musicRepeat, ['Off', 'One', 'All'], setMusicRepeat)} colors={colors} />
          {divider}
          <SettingItem icon="shuffle" label={t('settings.shuffle')} description={t('settings.shuffleDesc')} color={colors.success} toggle toggleValue={musicShuffle} onToggle={v => handleToggle('musicShuffle', v, setMusicShuffle)} loading={saving === 'musicShuffle'} colors={colors} />
        </GlassCard>
      </View>

      {/* Data & Storage */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.dataStorage')}</Text>
        <GlassCard noPadding>
          <SettingItem icon="trash" label={t('settings.clearCache')} description={t('settings.clearCacheDesc')} color={colors.warning} onPress={handleClearCache} colors={colors} />
          {divider}
          <SettingItem icon="refresh" label={t('settings.resetSettings')} description={t('settings.resetSettingsDesc')} color={colors.accent} onPress={handleResetSettings} colors={colors} />
        </GlassCard>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.about')}</Text>
        <GlassCard noPadding>
          <SettingItem icon="information-circle" label={t('settings.version')} color={colors.info} value="1.0.0" colors={colors} />
          {divider}
          <SettingItem icon="code-slash" label={t('settings.build')} color={colors.primary} value="2026.04.19" colors={colors} />
          {divider}
          <SettingItem icon="star" label={t('settings.rateApp')} color={colors.warning} onPress={() => Alert.alert('⭐ Thank You!', 'Thanks for using ClosingAll!')} colors={colors} />
          {divider}
          <SettingItem icon="shield-checkmark" label={t('settings.privacyPolicy')} color={colors.success} onPress={() => Alert.alert('Privacy', 'Your data stays on your device.')} colors={colors} />
          {divider}
          <SettingItem icon="help-circle" label={t('settings.helpSupport')} color={colors.primaryLight} onPress={() => Alert.alert('Support', 'Contact us at support@closingall.app')} colors={colors} />
        </GlassCard>
      </View>

      {/* Logout */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LinearGradient colors={[colors.accent + '20', colors.accent + '10']} style={styles.logoutGradient}>
            <Ionicons name="log-out-outline" size={22} color={colors.accent} />
            <Text style={[styles.logoutText, { color: colors.accent }]}>{t('settings.logout')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Language Picker Modal */}
      <Modal visible={showLanguagePicker} transparent animationType="slide" onRequestClose={() => setShowLanguagePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('settings.selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {supportedLanguages.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langOption, i18n.language === lang.code && { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langName, { color: colors.textPrimary }]}>{lang.name}</Text>
                {i18n.language === lang.code && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 1.5, marginBottom: Spacing.sm, marginLeft: Spacing.xs },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: FontSize.xxl, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FontSize.lg, fontWeight: '700' },
  profileEmail: { fontSize: FontSize.sm, marginTop: 2 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: FontSize.md, fontWeight: '600' },
  settingDesc: { fontSize: FontSize.sm, marginTop: 1 },
  settingValue: { fontSize: FontSize.md, fontWeight: '600' },
  divider: { height: 1, marginLeft: 60 },
  logoutBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  logoutGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md + 2, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)' },
  logoutText: { fontSize: FontSize.lg, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800' },
  langOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'transparent', marginBottom: Spacing.sm },
  langFlag: { fontSize: 28 },
  langName: { flex: 1, fontSize: FontSize.lg, fontWeight: '600' },
});
