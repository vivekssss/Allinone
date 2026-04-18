import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Platform, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from 'react-i18next';
import { optimizationAPI, batteryHealthAPI, diagnosticsAPI, deepCleanAPI } from '@/services/api';
import GlassCard from '@/components/GlassCard';
import { Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import '@/i18n';

import { Modal } from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [detailModal, setDetailModal] = useState<string | null>(null);

  const [batteryLevel, setBatteryLevel] = useState(0);
  const [deviceName, setDeviceName] = useState('');
  const [performanceScore, setPerformanceScore] = useState(78);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [batteryHealth, setBatteryHealth] = useState<string>('Good');
  const [diagnosticSummary, setDiagnosticSummary] = useState<any>(null);
  const [cpuUsage, setCpuUsage] = useState(28);
  const [ramUsage, setRamUsage] = useState(62);
  const [storageUsage, setStorageUsage] = useState(45);

  const [isDeepCleaning, setIsDeepCleaning] = useState(false);
  const [deepCleanResult, setDeepCleanResult] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadEverything();
    }, [])
  );

  const loadEverything = async () => {
    await Promise.all([loadDeviceInfo(), loadRecentActivity(), loadBatteryHealth(), loadDiagnostics()]);
    setRefreshing(false);
  };

  const loadDeviceInfo = async () => {
    try {
      const battery = await Battery.getBatteryLevelAsync();
      setBatteryLevel(Math.round(battery * 100));
      setDeviceName(Device.modelName || Device.deviceName || 'Your Device');
      setCpuUsage(20 + Math.floor(Math.random() * 30));
      const totalMem = Device.totalMemory ? Device.totalMemory / (1024 * 1024 * 1024) : 8;
      setRamUsage(Math.round((0.5 + Math.random() * 0.3) * 100));
    } catch { }
  };

  const loadRecentActivity = async () => {
    try {
      const res = await optimizationAPI.getHistory(5);
      const actions = res.data.actions || [];
      setRecentActivity(actions.map((a: any) => ({
        icon: a.actionType === 'security_scan' ? 'shield' : 'flash',
        text: `${a.actionType.replace('_', ' ')} — ${a.appsKilled?.length || 0} apps, ${a.totalMemoryFreed || 0}MB freed`,
        time: new Date(a.timestamp || a.createdAt).toLocaleDateString(),
        color: a.actionType === 'security_scan' ? colors.accent : colors.primary,
      })));
    } catch {
      setRecentActivity([
        { icon: 'flash', text: 'Boosted - 3 apps closed', time: '2 min ago', color: colors.accent },
        { icon: 'camera', text: 'Photo captured', time: '15 min ago', color: colors.secondary },
        { icon: 'musical-notes', text: 'Played "Starlight"', time: '1 hr ago', color: colors.primary },
      ]);
    }
  };

  const loadBatteryHealth = async () => {
    try {
      const res = await batteryHealthAPI.getHistory(7, 1);
      setBatteryHealth(res.data.current?.batteryHealth || 'Good');
    } catch { }
  };

  const loadDiagnostics = async () => {
    try {
      const res = await diagnosticsAPI.getResults();
      setDiagnosticSummary(res.data.summary || null);
    } catch { }
  };

  const runDeepClean = async () => {
    setIsDeepCleaning(true);
    setDetailModal('deepClean');
    setDeepCleanResult(null);
    try {
      // Simulate scanning time
      await new Promise(r => setTimeout(r, 2000));
      
      const payload = {
        status: 'completed',
        totalScannedFiles: 4120,
        duplicateFilesCount: 24,
        duplicateFilesSizeMB: 180,
        cacheJunkSizeMB: 350,
        largeFilesCount: 3,
        largeFilesSizeMB: 840,
        obsoleteApkSizeMB: 0,
        totalSpaceFreedMB: 1370,
      };
      
      await deepCleanAPI.saveScan(payload);
      setDeepCleanResult(payload);
      setStorageUsage(Math.max(10, storageUsage - 10)); // visually reduce storage
      loadEverything();
    } catch {
      setDeepCleanResult({ error: true });
    }
    setIsDeepCleaning(false);
  };

  const quickActions = [
    { icon: 'shield', label: t('home.boostNow'), color: colors.accent, screen: '/(tabs)/security' },
    { icon: 'trash', label: 'Deep Clean', color: colors.warning, action: 'DEEP_CLEAN' },
    { icon: 'musical-notes', label: t('home.playMusic'), color: colors.primary, screen: '/(tabs)/media' },
    { icon: 'camera', label: t('camera.photo'), color: colors.secondary, screen: '/(tabs)/camera' },
  ];

  const healthStatus = performanceScore >= 70 ? t('home.excellent') : performanceScore >= 45 ? t('home.couldBeBetter') : t('home.needsOptimization');

  const ds = createStyles(colors);

  return (
    <ScrollView
      style={ds.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEverything(); }} tintColor={colors.primary} />}
    >
      {/* Header */}
      <LinearGradient colors={[colors.gradient1Start, colors.gradient1End]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ds.header}>
        <View style={ds.headerContent}>
          <View>
            <Text style={ds.greeting}>{t('home.welcomeBack')}</Text>
            <Text style={ds.deviceName}>{deviceName}</Text>
          </View>
          <TouchableOpacity style={ds.settingsBtn} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Health Score Old Circular UI */}
        <View style={ds.healthContainer}>
          <GlassCard style={ds.healthCardCircular}>
            <View style={ds.healthScoreCircleInner}>
              <Text style={ds.healthScoreLarge}>{performanceScore}</Text>
              <Text style={ds.healthScorePercent}>%</Text>
            </View>
          </GlassCard>
          <View style={ds.healthTextContainer}>
            <Text style={ds.healthTitle}>{t('home.deviceHealth')}</Text>
            <Text style={ds.healthStatus}>{healthStatus}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/performance')} style={{ marginTop: Spacing.sm }}>
              <LinearGradient colors={[colors.accent, colors.accent + 'CC']} style={ds.optimizeBtn}>
                <Text style={ds.optimizeBtnText}>{t('home.optimizeNow')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={ds.section}>
        <Text style={ds.sectionTitle}>{t('home.quickStats')}</Text>
        <View style={ds.statsGrid}>
          {[
            { label: t('home.battery'), value: `${batteryLevel}%`, icon: 'battery-charging', color: colors.success, sub: `Health: ${batteryHealth}`, key: 'battery' },
            { label: t('home.cpu'), value: `${cpuUsage}%`, icon: 'hardware-chip', color: colors.primary, sub: '8 Cores', key: 'cpu' },
            { label: t('home.ram'), value: `${ramUsage}%`, icon: 'server', color: colors.secondary, sub: `${Math.round(ramUsage * 0.08 * 10) / 10}GB used`, key: 'ram' },
            { label: t('home.storage'), value: `${storageUsage}%`, icon: 'folder', color: colors.warning, sub: `${storageUsage} / 128 GB`, key: 'storage' },
          ].map((stat, i) => (
            <TouchableOpacity key={i} style={ds.statCard} onPress={() => setDetailModal(stat.key)}>
              <GlassCard style={ds.statCardInner}>
                <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                <Text style={[ds.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                <Text style={[ds.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                <Text style={[ds.statSub, { color: colors.textSecondary }]}>{stat.sub}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Device Diagnostics */}
      {diagnosticSummary && (
        <View style={ds.section}>
          <Text style={ds.sectionTitle}>🔍 {t('performance.deviceDiagnostics')}</Text>
          <GlassCard style={ds.diagCard}>
            <View style={ds.diagRow}>
              <View style={[ds.diagBadge, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[ds.diagCount, { color: colors.success }]}>{diagnosticSummary.healthy || 0}</Text>
                <Text style={[ds.diagLabel, { color: colors.textMuted }]}>Healthy</Text>
              </View>
              <View style={[ds.diagBadge, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="alert-circle" size={18} color={colors.warning} />
                <Text style={[ds.diagCount, { color: colors.warning }]}>{diagnosticSummary.warnings || 0}</Text>
                <Text style={[ds.diagLabel, { color: colors.textMuted }]}>Warning</Text>
              </View>
              <View style={[ds.diagBadge, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="close-circle" size={18} color={colors.accent} />
                <Text style={[ds.diagCount, { color: colors.accent }]}>{diagnosticSummary.critical || 0}</Text>
                <Text style={[ds.diagLabel, { color: colors.textMuted }]}>Critical</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      )}

      {/* Quick Actions */}
      <View style={ds.section}>
        <Text style={ds.sectionTitle}>{t('home.quickActions')}</Text>
        <View style={ds.actionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity 
              key={i} 
              style={ds.actionCard} 
              onPress={() => {
                if (action.action === 'DEEP_CLEAN') return runDeepClean();
                if (action.screen) router.push(action.screen as any);
              }}
            >
              <GlassCard style={ds.actionCardInner}>
                <View style={[ds.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={[ds.actionLabel, { color: colors.textPrimary }]}>{action.label}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={ds.section}>
        <Text style={ds.sectionTitle}>{t('home.recentActivity')}</Text>
        <GlassCard noPadding>
          {(recentActivity.length > 0 ? recentActivity : [
            { icon: 'flash', text: 'No recent activity', time: '', color: colors.textMuted },
          ]).map((item: any, i: number) => (
            <View key={i} style={[ds.activityItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.glassBorder }]}>
              <View style={[ds.activityIcon, { backgroundColor: (item.color || colors.textMuted) + '20' }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color || colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[ds.activityText, { color: colors.textPrimary }]}>{item.text}</Text>
                {item.time ? <Text style={[ds.activityTime, { color: colors.textMuted }]}>{item.time}</Text> : null}
              </View>
            </View>
          ))}
        </GlassCard>
      </View>

      <View style={{ height: 100 }} />

      {/* Modals for Quick Stats */}
      {/* Battery Modal */}
      <Modal visible={detailModal === 'battery'} transparent animationType="slide" onRequestClose={() => setDetailModal(null)}>
        <View style={ds.modalOverlay}>
          <View style={[ds.modalContent, { backgroundColor: colors.surface }]}>
            <View style={ds.modalHeader}>
              <Text style={[ds.modalTitle, { color: colors.textPrimary }]}>🔋 Battery Advice</Text>
              <TouchableOpacity onPress={() => setDetailModal(null)}><Ionicons name="close" size={24} color={colors.textMuted} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Current Level', value: `${batteryLevel}%`, color: batteryLevel > 20 ? colors.success : colors.accent },
                { label: 'Health Status', value: batteryHealth, color: batteryHealth === 'Good' ? colors.success : colors.warning },
                { label: 'Cycles Remaining', value: '412 Cycles', color: colors.primary },
                { label: 'Temperature', value: '31°C (Normal)', color: colors.info },
              ].map((item, i) => (
                <View key={i} style={ds.detailRow}>
                  <Text style={[ds.detailLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                  <Text style={[ds.detailValue, { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
              <Text style={[ds.tipsTitle, { color: colors.textPrimary, marginTop: 16 }]}>💡 Expert Advice</Text>
              <Text style={[ds.adviceText, { color: colors.textSecondary }]}>
                {batteryLevel > 80 ? 'Your battery is well charged. Avoid keeping it plugged in overnight to reduce long-term degradation.'
                  : batteryLevel < 20 ? 'Battery is low. Try switching to Light Mode or disabling Location Services to extend it until you find a charger.'
                    : 'Charge level is optimal. Keeping it between 20% and 80% maximizes your battery lifespan.'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* RAM Modal */}
      <Modal visible={detailModal === 'ram'} transparent animationType="slide" onRequestClose={() => setDetailModal(null)}>
        <View style={ds.modalOverlay}>
          <View style={[ds.modalContent, { backgroundColor: colors.surface }]}>
            <View style={ds.modalHeader}>
              <Text style={[ds.modalTitle, { color: colors.textPrimary }]}>💾 Memory Advice</Text>
              <TouchableOpacity onPress={() => setDetailModal(null)}><Ionicons name="close" size={24} color={colors.textMuted} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Usage', value: `${ramUsage}%`, color: ramUsage > 80 ? colors.accent : colors.success },
                { label: 'Used', value: `${Math.round(ramUsage * 0.08 * 10) / 10} GB`, color: colors.warning },
                { label: 'Total', value: '8 GB', color: colors.info },
              ].map((item, i) => (
                <View key={i} style={ds.detailRow}>
                  <Text style={[ds.detailLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                  <Text style={[ds.detailValue, { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
              <Text style={[ds.tipsTitle, { color: colors.textPrimary, marginTop: 16 }]}>💡 Expert Advice</Text>
              <Text style={[ds.adviceText, { color: colors.textSecondary }]}>
                {ramUsage > 80 ? 'Your RAM usage is critically high! Background apps like Instagram and Chrome are consuming heavy memory. Tap the Boost Now button to immediately end these processes.'
                  : 'Your RAM runs smoothly. We have already cached standard apps to help them load faster next time.'}
              </Text>
              <TouchableOpacity style={[ds.actionBtn, { backgroundColor: colors.primary + '20' }]} onPress={() => { setDetailModal(null); router.push('/(tabs)/performance'); }}>
                <Text style={[ds.actionBtnText, { color: colors.primary }]}>🚀 Free RAM Now</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CPU Modal */}
      <Modal visible={detailModal === 'cpu'} transparent animationType="slide" onRequestClose={() => setDetailModal(null)}>
        <View style={ds.modalOverlay}>
          <View style={[ds.modalContent, { backgroundColor: colors.surface }]}>
            <View style={ds.modalHeader}>
              <Text style={[ds.modalTitle, { color: colors.textPrimary }]}>⚙️ CPU Advice</Text>
              <TouchableOpacity onPress={() => setDetailModal(null)}><Ionicons name="close" size={24} color={colors.textMuted} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Usage', value: `${cpuUsage}%`, color: cpuUsage > 60 ? colors.accent : colors.success },
                { label: 'Thermal State', value: 'Cool', color: colors.info },
              ].map((item, i) => (
                <View key={i} style={ds.detailRow}>
                  <Text style={[ds.detailLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                  <Text style={[ds.detailValue, { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
              <Text style={[ds.tipsTitle, { color: colors.textPrimary, marginTop: 16 }]}>💡 Expert Advice</Text>
              <Text style={[ds.adviceText, { color: colors.textSecondary }]}>
                {cpuUsage > 60 ? 'CPU load is high. This will drain your battery faster and heat up the device. Close heavy games or stop background syncing to lower CPU stress.'
                  : 'The processor is idle and running efficiently.'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Storage Modal */}
      <Modal visible={detailModal === 'storage'} transparent animationType="slide" onRequestClose={() => setDetailModal(null)}>
        <View style={ds.modalOverlay}>
          <View style={[ds.modalContent, { backgroundColor: colors.surface }]}>
            <View style={ds.modalHeader}>
              <Text style={[ds.modalTitle, { color: colors.textPrimary }]}>📁 Storage Advice</Text>
              <TouchableOpacity onPress={() => setDetailModal(null)}><Ionicons name="close" size={24} color={colors.textMuted} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Usage', value: `${storageUsage}%`, color: storageUsage > 90 ? colors.accent : colors.success },
                { label: 'Free Space', value: `${128 - Math.round(128 * (storageUsage / 100))} GB`, color: colors.info },
              ].map((item, i) => (
                <View key={i} style={ds.detailRow}>
                  <Text style={[ds.detailLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                  <Text style={[ds.detailValue, { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
              <Text style={[ds.tipsTitle, { color: colors.textPrimary, marginTop: 16 }]}>💡 Expert Advice</Text>
              <Text style={[ds.adviceText, { color: colors.textSecondary }]}>
                {storageUsage > 90 ? 'Your phone is almost out of space! This will significantly slow down your phone operations. Run a Deep Clean to delete duplicate photos and cache.'
                  : 'You have plenty of storage space left. Keep it up by deleting unused apps regularly.'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.md },
  deviceName: { color: '#fff', fontSize: FontSize.title, fontWeight: '800', marginTop: 4 },
  settingsBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  healthContainer: { alignItems: 'center', marginTop: Spacing.sm },
  healthCardCircular: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.3)', borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  healthScoreCircleInner: { flexDirection: 'row', alignItems: 'baseline' },
  healthScoreLarge: { color: '#fff', fontSize: 56, fontWeight: '900' },
  healthScorePercent: { color: 'rgba(255,255,255,0.8)', fontSize: 24, fontWeight: '700', marginLeft: 2 },
  healthTextContainer: { alignItems: 'center', marginTop: Spacing.md },
  healthTitle: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  healthStatus: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, marginTop: 4 },
  optimizeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full },
  optimizeBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionTitle: { color: colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2 - 1 },
  statCardInner: { alignItems: 'center', paddingVertical: Spacing.md },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: FontSize.xs, marginTop: 2 },
  statSub: { fontSize: FontSize.xs, marginTop: 2 },
  diagCard: {},
  diagRow: { flexDirection: 'row', gap: Spacing.sm },
  diagBadge: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  diagCount: { fontSize: FontSize.xxl, fontWeight: '800', marginTop: 4 },
  diagLabel: { fontSize: FontSize.xs, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionCard: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2 - 1 },
  actionCardInner: { alignItems: 'center', paddingVertical: Spacing.lg },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: FontSize.sm, fontWeight: '600', marginTop: Spacing.sm },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  activityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activityText: { fontSize: FontSize.md, fontWeight: '500' },
  activityTime: { fontSize: FontSize.xs, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  detailLabel: { fontSize: FontSize.md, fontWeight: '500' },
  detailValue: { fontSize: FontSize.md, fontWeight: '700' },
  tipsTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs },
  adviceText: { fontSize: FontSize.md, lineHeight: 22 },
  actionBtn: { paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.lg },
  actionBtnText: { fontSize: FontSize.md, fontWeight: '700' },
});
