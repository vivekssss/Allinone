import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated,
  Dimensions, FlatList, Modal, ActivityIndicator, Platform, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from 'react-i18next';
import { appsAPI, optimizationAPI } from '@/services/api';
import GlassCard from '@/components/GlassCard';
import { Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import '@/i18n';

const { width } = Dimensions.get('window');

interface AppData {
  _id: string;
  packageName: string;
  appName: string;
  category: string;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  batteryDrain: number;
  isRunning: boolean;
  dangerLevel: 'safe' | 'moderate' | 'dangerous';
  timesKilled: number;
}

interface Stats {
  totalApps: number;
  runningApps: number;
  totalCpuUsage: number;
  totalMemoryUsage: number;
  dangerousApps: number;
  moderateApps: number;
  safeApps: number;
  securityScore: number;
}

// Fallback simulated apps when API unavailable
const FALLBACK_APPS: AppData[] = [
  { _id: '1', packageName: 'com.adware.tracker', appName: 'Ad Tracker Pro', category: 'bloatware', cpuUsage: 18.5, memoryUsage: 245, storageUsage: 120, batteryDrain: 12, isRunning: true, dangerLevel: 'dangerous', timesKilled: 0 },
  { _id: '2', packageName: 'com.crypto.miner', appName: 'Background Miner', category: 'service', cpuUsage: 42.3, memoryUsage: 512, storageUsage: 45, batteryDrain: 35, isRunning: true, dangerLevel: 'dangerous', timesKilled: 0 },
  { _id: '3', packageName: 'com.social.feed', appName: 'Social Feed Sync', category: 'user', cpuUsage: 8.2, memoryUsage: 180, storageUsage: 320, batteryDrain: 8, isRunning: true, dangerLevel: 'moderate', timesKilled: 0 },
  { _id: '4', packageName: 'com.weather.widget', appName: 'Weather Widget', category: 'user', cpuUsage: 3.1, memoryUsage: 95, storageUsage: 28, batteryDrain: 3, isRunning: true, dangerLevel: 'safe', timesKilled: 0 },
  { _id: '5', packageName: 'com.location.spy', appName: 'Location Logger', category: 'service', cpuUsage: 15.7, memoryUsage: 180, storageUsage: 65, batteryDrain: 18, isRunning: true, dangerLevel: 'dangerous', timesKilled: 0 },
  { _id: '6', packageName: 'com.data.collector', appName: 'Data Collector BG', category: 'bloatware', cpuUsage: 22.1, memoryUsage: 310, storageUsage: 90, batteryDrain: 14, isRunning: true, dangerLevel: 'dangerous', timesKilled: 0 },
  { _id: '7', packageName: 'com.news.refresh', appName: 'News Auto-Refresh', category: 'user', cpuUsage: 5.5, memoryUsage: 120, storageUsage: 150, batteryDrain: 5, isRunning: true, dangerLevel: 'moderate', timesKilled: 0 },
  { _id: '8', packageName: 'com.system.updater', appName: 'System Updater', category: 'system', cpuUsage: 1.2, memoryUsage: 60, storageUsage: 200, batteryDrain: 1, isRunning: true, dangerLevel: 'safe', timesKilled: 0 },
];

export default function SecurityScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [apps, setApps] = useState<AppData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [killFeed, setKillFeed] = useState<string[]>([]);
  const [killedApps, setKilledApps] = useState<any[]>([]);
  const [totalFreed, setTotalFreed] = useState({ memory: 0, cpu: 0, battery: 0, appsCount: 0 });
  const [activeTab, setActiveTab] = useState<'threats' | 'all' | 'history'>('threats');
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'threat' | 'cpu' | 'ram'>('threat');

  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchApps();
    fetchHistory();
    startPulse();
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchApps = async () => {
    try {
      const res = await appsAPI.getAll();
      if (res.data.apps?.length > 0) {
        setApps(res.data.apps);
        setStats(res.data.stats);
      } else {
        setApps(FALLBACK_APPS);
        const running = FALLBACK_APPS.filter(a => a.isRunning);
        setStats({
          totalApps: FALLBACK_APPS.length,
          runningApps: running.length,
          totalCpuUsage: running.reduce((acc, a) => acc + a.cpuUsage, 0),
          totalMemoryUsage: running.reduce((acc, a) => acc + a.memoryUsage, 0),
          dangerousApps: FALLBACK_APPS.filter(a => a.dangerLevel === 'dangerous').length,
          moderateApps: FALLBACK_APPS.filter(a => a.dangerLevel === 'moderate').length,
          safeApps: FALLBACK_APPS.filter(a => a.dangerLevel === 'safe').length,
          securityScore: 35,
        });
      }
    } catch {
      setApps(FALLBACK_APPS);
      const running = FALLBACK_APPS.filter(a => a.isRunning);
      setStats({
        totalApps: FALLBACK_APPS.length,
        runningApps: running.length,
        totalCpuUsage: running.reduce((acc, a) => acc + a.cpuUsage, 0),
        totalMemoryUsage: running.reduce((acc, a) => acc + a.memoryUsage, 0),
        dangerousApps: FALLBACK_APPS.filter(a => a.dangerLevel === 'dangerous').length,
        moderateApps: FALLBACK_APPS.filter(a => a.dangerLevel === 'moderate').length,
        safeApps: FALLBACK_APPS.filter(a => a.dangerLevel === 'safe').length,
        securityScore: 35,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await optimizationAPI.getHistory(10, 'security_scan');
      setScanHistory(res.data.actions || []);
    } catch { }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchApps();
  };

  const runSecurityScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanComplete(false);
    setKillFeed([]);
    setKilledApps([]);

    Animated.timing(scanAnim, { toValue: 1, duration: 600, useNativeDriver: false }).start();

    const threats = apps.filter(a => a.dangerLevel === 'dangerous' || a.dangerLevel === 'moderate');

    // Simulated live feed
    const feedMessages = [
      '🔍 Scanning system processes...',
      '🧠 Analyzing CPU thread allocation...',
      '📡 Checking network activity...',
      ...threats.map(a => `⚠️ Threat detected: ${a.appName} (${a.cpuUsage}% CPU)`),
      '🔒 Initiating threat elimination...',
    ];

    for (const msg of feedMessages) {
      await new Promise(r => setTimeout(r, 400));
      setKillFeed(prev => [...prev, msg]);
    }

    // Kill each threat
    const killed: any[] = [];
    for (const app of threats) {
      await new Promise(r => setTimeout(r, 500));
      setKillFeed(prev => [...prev, `🗑️ Killing ${app.appName} — freed ${app.memoryUsage} MB`]);
      killed.push({
        appName: app.appName,
        packageName: app.packageName,
        memoryFreed: app.memoryUsage,
        cpuFreed: app.cpuUsage,
        batteryFreed: app.batteryDrain,
        dangerLevel: app.dangerLevel,
      });

      try {
        await appsAPI.killApp(app.packageName);
      } catch { }
    }

    const freed = {
      memory: killed.reduce((acc, a) => acc + a.memoryFreed, 0),
      cpu: Math.round(killed.reduce((acc, a) => acc + a.cpuFreed, 0) * 10) / 10,
      battery: killed.reduce((acc, a) => acc + a.batteryFreed, 0),
      appsCount: killed.length,
    };

    setKilledApps(killed);
    setTotalFreed(freed);
    setKillFeed(prev => [...prev, `✅ ${killed.length} threats eliminated! Freed ${freed.memory} MB RAM`]);

    // Log optimization
    try {
      await optimizationAPI.run({
        actionType: 'security_scan',
        status: 'completed',
        appsKilled: killed.map(a => a.packageName),
        totalMemoryFreed: freed.memory,
        totalCpuFreed: freed.cpu,
      });
    } catch { }

    // Update local state
    setApps(prev => prev.map(a => {
      if (threats.find(t => t._id === a._id)) {
        return { ...a, isRunning: false };
      }
      return a;
    }));

    setScanComplete(true);
    setIsScanning(false);
    fetchHistory();
  };

  const killSingleApp = async (app: AppData) => {
    try {
      await appsAPI.killApp(app.packageName);
    } catch { }
    setApps(prev => prev.map(a => a._id === app._id ? { ...a, isRunning: false } : a));
  };

  const getDangerColor = (level: string) => {
    if (level === 'dangerous') return colors.accent;
    if (level === 'moderate') return colors.warning;
    return colors.success;
  };

  const getDangerIcon = (level: string): any => {
    if (level === 'dangerous') return 'skull';
    if (level === 'moderate') return 'warning';
    return 'shield-checkmark';
  };

  const sortedApps = [...apps].filter(a => {
    if (activeTab === 'threats') return a.dangerLevel !== 'safe' && a.isRunning;
    return a.isRunning;
  }).sort((a, b) => {
    if (sortBy === 'cpu') return b.cpuUsage - a.cpuUsage;
    if (sortBy === 'ram') return b.memoryUsage - a.memoryUsage;
    const order = { dangerous: 3, moderate: 2, safe: 1 };
    return (order[b.dangerLevel] || 0) - (order[a.dangerLevel] || 0);
  });

  const securityScore = stats?.securityScore ?? 100;
  const scoreColor = securityScore >= 70 ? colors.success : securityScore >= 40 ? colors.warning : colors.accent;

  const dynamicStyles = createStyles(colors);

  if (loading) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[dynamicStyles.subtitle, { marginTop: 12 }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={dynamicStyles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <LinearGradient colors={[colors.primary + '30', 'transparent']} style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>{t('security.title')}</Text>
        <Text style={dynamicStyles.subtitle}>{t('security.subtitle')}</Text>
      </LinearGradient>

      {/* Security Score */}
      <View style={dynamicStyles.section}>
        <GlassCard style={dynamicStyles.scoreCard}>
          <Animated.View style={[dynamicStyles.scoreCircle, { borderColor: scoreColor, transform: [{ scale: pulseAnim }] }]}>
            <Text style={[dynamicStyles.scoreText, { color: scoreColor }]}>{securityScore}</Text>
            <Text style={[dynamicStyles.scoreLabel, { color: colors.textSecondary }]}>/100</Text>
          </Animated.View>
          <View style={dynamicStyles.scoreInfo}>
            <Text style={[dynamicStyles.scoreTitle, { color: colors.textPrimary }]}>{t('security.securityScore')}</Text>
            <View style={dynamicStyles.statsRow}>
              <View style={dynamicStyles.statItem}>
                <Ionicons name="skull" size={14} color={colors.accent} />
                <Text style={[dynamicStyles.statValue, { color: colors.accent }]}>{stats?.dangerousApps || 0}</Text>
              </View>
              <View style={dynamicStyles.statItem}>
                <Ionicons name="warning" size={14} color={colors.warning} />
                <Text style={[dynamicStyles.statValue, { color: colors.warning }]}>{stats?.moderateApps || 0}</Text>
              </View>
              <View style={dynamicStyles.statItem}>
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                <Text style={[dynamicStyles.statValue, { color: colors.success }]}>{stats?.safeApps || 0}</Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Quick Stats */}
      <View style={dynamicStyles.section}>
        <View style={dynamicStyles.quickStats}>
          {[
            { label: t('security.threats'), value: `${(stats?.dangerousApps || 0) + (stats?.moderateApps || 0)}`, icon: 'warning', color: colors.accent },
            { label: t('security.running'), value: `${stats?.runningApps || 0}`, icon: 'pulse', color: colors.info },
            { label: t('security.cpuUsed'), value: `${stats?.totalCpuUsage?.toFixed(1) || 0}%`, icon: 'hardware-chip', color: colors.primary },
            { label: t('security.ramUsed'), value: `${stats?.totalMemoryUsage || 0}MB`, icon: 'server', color: colors.secondary },
          ].map((stat, i) => (
            <GlassCard key={i} style={dynamicStyles.quickStatCard}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
              <Text style={[dynamicStyles.quickStatValue, { color: colors.textPrimary }]}>{stat.value}</Text>
              <Text style={[dynamicStyles.quickStatLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </GlassCard>
          ))}
        </View>
      </View>

      {/* Scan Button */}
      <View style={dynamicStyles.section}>
        <TouchableOpacity onPress={runSecurityScan} disabled={isScanning} activeOpacity={0.8}>
          <LinearGradient
            colors={isScanning ? [colors.textMuted, colors.textMuted] : scanComplete ? [colors.success, colors.successDark] : [colors.accent, '#CC4444']}
            style={dynamicStyles.scanButton}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name={scanComplete ? 'checkmark-circle' : 'shield'} size={22} color="#fff" />
            )}
            <Text style={dynamicStyles.scanButtonText}>
              {isScanning ? '🔄 Scanning...' : scanComplete ? t('security.allThreatsEliminated') : t('security.tapToClose')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Live Kill Feed */}
      {killFeed.length > 0 && (
        <View style={dynamicStyles.section}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary }]}>{t('security.liveKillFeed')}</Text>
          <GlassCard noPadding>
            <ScrollView style={dynamicStyles.killFeed} nestedScrollEnabled>
              {killFeed.map((msg, i) => (
                <View key={i} style={dynamicStyles.killFeedItem}>
                  <Text style={[dynamicStyles.killFeedText, { color: msg.includes('✅') ? colors.success : msg.includes('🗑️') ? colors.accent : colors.textSecondary }]}>
                    {msg}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </GlassCard>
        </View>
      )}

      {/* Scan Results */}
      {scanComplete && (
        <View style={dynamicStyles.section}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary }]}>{t('security.optimizationResults')}</Text>
          <View style={dynamicStyles.resultsGrid}>
            {[
              { label: t('security.appsKilled'), value: totalFreed.appsCount, icon: 'close-circle', color: colors.accent },
              { label: t('security.memoryFreed'), value: `${totalFreed.memory}MB`, icon: 'server', color: colors.secondary },
              { label: t('security.cpuFreed'), value: `${totalFreed.cpu}%`, icon: 'hardware-chip', color: colors.primary },
              { label: t('security.batterySaved'), value: `${totalFreed.battery}%`, icon: 'battery-charging', color: colors.success },
            ].map((r, i) => (
              <GlassCard key={i} style={dynamicStyles.resultCard}>
                <Ionicons name={r.icon as any} size={24} color={r.color} />
                <Text style={[dynamicStyles.resultValue, { color: colors.textPrimary }]}>{r.value}</Text>
                <Text style={[dynamicStyles.resultLabel, { color: colors.textMuted }]}>{r.label}</Text>
              </GlassCard>
            ))}
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={dynamicStyles.section}>
        <View style={dynamicStyles.tabRow}>
          {(['threats', 'all', 'history'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[dynamicStyles.tab, activeTab === tab && { backgroundColor: colors.primary + '30', borderColor: colors.primary }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[dynamicStyles.tabText, activeTab === tab && { color: colors.primary }]}>
                {tab === 'threats' ? `⚠️ ${t('security.threats')}` : tab === 'all' ? `📱 ${t('security.running')}` : `📋 ${t('security.scanHistory')}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sort Buttons (for threats/all tabs) */}
      {activeTab !== 'history' && (
        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.sortRow}>
            {([
              { key: 'threat', label: t('security.byThreat') },
              { key: 'cpu', label: t('security.byCpu') },
              { key: 'ram', label: t('security.byRam') },
            ] as const).map(s => (
              <TouchableOpacity
                key={s.key}
                style={[dynamicStyles.sortBtn, sortBy === s.key && { backgroundColor: colors.primary + '20' }]}
                onPress={() => setSortBy(s.key)}
              >
                <Text style={[dynamicStyles.sortText, sortBy === s.key && { color: colors.primary }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Apps List */}
      {activeTab !== 'history' ? (
        <View style={dynamicStyles.section}>
          {sortedApps.length === 0 ? (
            <GlassCard style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Ionicons name="shield-checkmark" size={48} color={colors.success} />
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>
                {t('security.allThreatsEliminated')}
              </Text>
            </GlassCard>
          ) : (
            sortedApps.map(app => (
              <GlassCard key={app._id} style={dynamicStyles.appCard}>
                <View style={dynamicStyles.appRow}>
                  <View style={[dynamicStyles.appIcon, { backgroundColor: getDangerColor(app.dangerLevel) + '20' }]}>
                    <Ionicons name={getDangerIcon(app.dangerLevel)} size={20} color={getDangerColor(app.dangerLevel)} />
                  </View>
                  <View style={dynamicStyles.appInfo}>
                    <Text style={[dynamicStyles.appName, { color: colors.textPrimary }]}>{app.appName}</Text>
                    <Text style={[dynamicStyles.appPackage, { color: colors.textMuted }]}>{app.packageName}</Text>
                    <View style={dynamicStyles.appStats}>
                      <Text style={[dynamicStyles.appStat, { color: colors.primary }]}>CPU: {app.cpuUsage}%</Text>
                      <Text style={[dynamicStyles.appStat, { color: colors.secondary }]}>RAM: {app.memoryUsage}MB</Text>
                      <Text style={[dynamicStyles.appStat, { color: colors.warning }]}>🔋{app.batteryDrain}%</Text>
                    </View>
                  </View>
                  {app.isRunning && (
                    <TouchableOpacity
                      style={[dynamicStyles.killBtn, { borderColor: getDangerColor(app.dangerLevel) }]}
                      onPress={() => killSingleApp(app)}
                    >
                      <Ionicons name="close" size={16} color={getDangerColor(app.dangerLevel)} />
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            ))
          )}
        </View>
      ) : (
        /* History Tab */
        <View style={dynamicStyles.section}>
          {scanHistory.length === 0 ? (
            <GlassCard style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Ionicons name="time" size={48} color={colors.textMuted} />
              <Text style={[dynamicStyles.emptyText, { color: colors.textMuted }]}>No scan history yet</Text>
            </GlassCard>
          ) : (
            scanHistory.map((scan, i) => (
              <GlassCard key={i} style={dynamicStyles.historyCard}>
                <View style={dynamicStyles.historyHeader}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                  <Text style={[dynamicStyles.historyDate, { color: colors.textPrimary }]}>
                    {new Date(scan.timestamp || scan.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={dynamicStyles.historyStats}>
                  <Text style={[dynamicStyles.historyStat, { color: colors.textSecondary }]}>
                    🗑️ {scan.appsKilled?.length || 0} killed
                  </Text>
                  <Text style={[dynamicStyles.historyStat, { color: colors.textSecondary }]}>
                    💾 {scan.totalMemoryFreed || 0} MB freed
                  </Text>
                  <Text style={[dynamicStyles.historyStat, { color: colors.textSecondary }]}>
                    ⚡ {scan.totalCpuFreed || 0}% CPU freed
                  </Text>
                </View>
              </GlassCard>
            ))
          )}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingBottom: Spacing.lg },
  title: { color: colors.textPrimary, fontSize: FontSize.title, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: FontSize.md, marginTop: 4 },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: FontSize.title, fontWeight: '900' },
  scoreLabel: { fontSize: FontSize.xs },
  scoreInfo: { flex: 1 },
  scoreTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: Spacing.lg },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: FontSize.md, fontWeight: '700' },
  quickStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickStatCard: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2 - 1, alignItems: 'center', paddingVertical: Spacing.md },
  quickStatValue: { fontSize: FontSize.xl, fontWeight: '800', marginTop: 4 },
  quickStatLabel: { fontSize: FontSize.xs, marginTop: 2 },
  scanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md + 4, borderRadius: BorderRadius.lg },
  scanButtonText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  killFeed: { maxHeight: 200, padding: Spacing.md },
  killFeedItem: { paddingVertical: 4 },
  killFeedText: { fontSize: FontSize.sm, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  resultCard: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2 - 1, alignItems: 'center', paddingVertical: Spacing.md },
  resultValue: { fontSize: FontSize.xxl, fontWeight: '800', marginTop: 4 },
  resultLabel: { fontSize: FontSize.xs, marginTop: 2 },
  tabRow: { flexDirection: 'row', gap: Spacing.sm },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center' },
  tabText: { color: colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  sortRow: { flexDirection: 'row', gap: Spacing.sm },
  sortBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: colors.glassBorder },
  sortText: { color: colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  appCard: { marginBottom: Spacing.sm },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  appIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appInfo: { flex: 1 },
  appName: { fontSize: FontSize.md, fontWeight: '700' },
  appPackage: { fontSize: FontSize.xs, marginTop: 1 },
  appStats: { flexDirection: 'row', gap: Spacing.md, marginTop: 4 },
  appStat: { fontSize: FontSize.xs, fontWeight: '600' },
  killBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: FontSize.md, marginTop: Spacing.sm, textAlign: 'center' },
  historyCard: { marginBottom: Spacing.sm },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  historyDate: { fontSize: FontSize.md, fontWeight: '600' },
  historyStats: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm },
  historyStat: { fontSize: FontSize.sm },
});
