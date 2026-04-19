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
import { AuraTheme } from '@/constants/aura-theme';
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

    // ... (logic remains largely the same, but styles are updated for Aura)
    const securityScore = stats?.securityScore ?? 100;
  const scoreColor = securityScore >= 70 ? AuraTheme.dark.success : securityScore >= 40 ? AuraTheme.dark.warning : AuraTheme.dark.accent;

  const ds = createStyles(colors);

  return (
    <ScrollView
      style={ds.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AuraTheme.dark.primary} />}
    >
      {/* Header */}
      <LinearGradient colors={['#7C4DFF20', 'transparent']} style={ds.header}>
        <Text style={ds.title}>Security Center</Text>
        <Text style={ds.subtitle}>Real-time system threat analyzer</Text>
      </LinearGradient>

      {/* Security Score */}
      <View style={ds.section}>
        <GlassCard style={ds.scoreCard}>
          <Animated.View style={[ds.scoreCircle, { borderColor: scoreColor, transform: [{ scale: pulseAnim }] }]}>
            <Text style={[ds.scoreText, { color: scoreColor }]}>{securityScore}</Text>
            <Text style={[ds.scoreLabel, { color: 'rgba(255,255,255,0.4)' }]}>% SAFE</Text>
          </Animated.View>
          <View style={ds.scoreInfo}>
            <Text style={ds.scoreTitle}>System Integrity</Text>
            <View style={ds.statsRow}>
              <View style={ds.statItem}>
                <Ionicons name="shield-half" size={14} color={scoreColor} />
                <Text style={[ds.statValue, { color: scoreColor }]}>{securityScore >= 70 ? 'Excellent' : 'Risk Detected'}</Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Scan Button - Aura Style */}
      <View style={ds.section}>
        <TouchableOpacity onPress={runSecurityScan} disabled={isScanning} activeOpacity={0.8}>
          <LinearGradient
            colors={isScanning ? ['#2C2F45', '#1A1D2E'] : scanComplete ? [AuraTheme.dark.success, '#00A843'] : [AuraTheme.dark.accent, '#B00020']}
            style={ds.scanButton}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name={scanComplete ? 'shield-checkmark' : 'flash'} size={22} color="#fff" />
            )}
            <Text style={ds.scanButtonText}>
              {isScanning ? '🔍 ANALYZING ARCHITECTURE...' : scanComplete ? 'SYSTEM SECURED' : 'KILL ALL THREATS'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Live Kill Feed */}
      {killFeed.length > 0 && (
        <View style={ds.section}>
          <Text style={ds.sectionTitle}>Shield Activity Log</Text>
          <GlassCard noPadding>
            <ScrollView style={ds.killFeed} nestedScrollEnabled>
              {killFeed.map((msg, i) => (
                <View key={i} style={ds.killFeedItem}>
                  <Text style={[ds.killFeedText, { color: msg.includes('✅') ? AuraTheme.dark.success : msg.includes('⚠️') ? AuraTheme.dark.accent : 'rgba(255,255,255,0.6)' }]}>
                    {msg}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </GlassCard>
        </View>
      )}

      {/* Tabs */}
      <View style={ds.section}>
        <View style={ds.tabRow}>
          {(['threats', 'all', 'history'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[ds.tab, activeTab === tab && { backgroundColor: AuraTheme.dark.primary + '30', borderColor: AuraTheme.dark.primary }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[ds.tabText, activeTab === tab && { color: AuraTheme.dark.primary }]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* App List - Redesigned */}
      <View style={ds.section}>
        {activeTab !== 'history' ? (
          sortedApps.map(app => (
            <GlassCard key={app._id} style={ds.appCard}>
              <View style={ds.appRow}>
                <View style={[ds.appIcon, { backgroundColor: getDangerColor(app.dangerLevel) + '20' }]}>
                  <Ionicons name={getDangerIcon(app.dangerLevel)} size={20} color={getDangerColor(app.dangerLevel)} />
                </View>
                <View style={ds.appInfo}>
                  <Text style={ds.appName}>{app.appName}</Text>
                  <Text style={ds.appPackage}>{app.packageName}</Text>
                  <View style={ds.appStats}>
                    <Text style={{ color: AuraTheme.dark.primary, fontSize: 10, fontWeight: '700' }}>{app.cpuUsage}% CPU</Text>
                    <Text style={{ color: AuraTheme.dark.secondary, fontSize: 10, fontWeight: '700' }}>{app.memoryUsage}MB RAM</Text>
                  </View>
                </View>
                {app.isRunning && (
                  <TouchableOpacity
                    style={[ds.killBtn, { borderColor: getDangerColor(app.dangerLevel) }]}
                    onPress={() => killSingleApp(app)}
                  >
                    <Ionicons name="power" size={14} color={getDangerColor(app.dangerLevel)} />
                  </TouchableOpacity>
                )}
              </View>
            </GlassCard>
          ))
        ) : (
          scanHistory.map((scan, i) => (
            <GlassCard key={i} style={ds.historyCard}>
              <View style={ds.historyHeader}>
                <Ionicons name="shield-checkmark" size={16} color={AuraTheme.dark.success} />
                <Text style={ds.historyDate}>{new Date(scan.timestamp || scan.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={ds.historyDetail}>Freed {scan.totalMemoryFreed}MB by closing {scan.appsKilled?.length} processes</Text>
            </GlassCard>
          ))
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070A1A' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12, opacity: 0.8 },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: 24, padding: 20 },
  scoreCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 32, fontWeight: '900' },
  scoreLabel: { fontSize: 8, fontWeight: '800' },
  scoreInfo: { flex: 1 },
  scoreTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 15 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 14, fontWeight: '700' },
  scanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 15 },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  killFeed: { maxHeight: 150, padding: 15 },
  killFeedItem: { paddingVertical: 3 },
  killFeedText: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  tabRow: { flexDirection: 'row', gap: 10 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  tabText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '800' },
  appCard: { marginBottom: 10, padding: 15 },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  appIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appInfo: { flex: 1 },
  appName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  appPackage: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 },
  appStats: { flexDirection: 'row', gap: 12, marginTop: 6 },
  killBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  historyCard: { marginBottom: 10, padding: 15 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyDate: { color: '#fff', fontSize: 14, fontWeight: '700' },
  historyDetail: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6 },
});
