import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '@/components/GlassCard';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface RunningApp {
  id: string;
  name: string;
  packageName: string;
  category: string;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  batteryDrain: number;
  status: 'running' | 'background' | 'idle' | 'killed';
  dangerLevel: 'safe' | 'moderate' | 'dangerous';
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SIMULATED_APPS: RunningApp[] = [
  { id: '1', name: 'Social Media Tracker', packageName: 'com.tracker.social', category: 'bloatware', cpuUsage: 18.5, memoryUsage: 156, storageUsage: 245, batteryDrain: 12, status: 'background', dangerLevel: 'dangerous', description: 'Tracks browsing habits and sends data to 3rd parties', icon: 'warning' },
  { id: '2', name: 'Ad Service Worker', packageName: 'com.ads.worker', category: 'service', cpuUsage: 14.2, memoryUsage: 98, storageUsage: 67, batteryDrain: 8, status: 'background', dangerLevel: 'dangerous', description: 'Displays background ads and collects usage data', icon: 'megaphone' },
  { id: '3', name: 'Analytics Daemon', packageName: 'com.analytics.daemon', category: 'service', cpuUsage: 11.8, memoryUsage: 84, storageUsage: 34, batteryDrain: 6, status: 'background', dangerLevel: 'dangerous', description: 'Constantly sends telemetry data consuming battery', icon: 'analytics' },
  { id: '4', name: 'Update Service', packageName: 'com.system.updater', category: 'service', cpuUsage: 8.3, memoryUsage: 72, storageUsage: 128, batteryDrain: 4, status: 'idle', dangerLevel: 'moderate', description: 'Checks for app updates periodically', icon: 'cloud-download' },
  { id: '5', name: 'Cache Manager', packageName: 'com.cache.manager', category: 'background', cpuUsage: 6.1, memoryUsage: 134, storageUsage: 512, batteryDrain: 3, status: 'background', dangerLevel: 'moderate', description: 'Caches data for faster loading, uses significant storage', icon: 'server' },
  { id: '6', name: 'Push Notifications', packageName: 'com.push.service', category: 'service', cpuUsage: 3.4, memoryUsage: 28, storageUsage: 12, batteryDrain: 2, status: 'running', dangerLevel: 'safe', description: 'Handles push notifications from installed apps', icon: 'notifications' },
  { id: '7', name: 'Location Service', packageName: 'com.location.service', category: 'service', cpuUsage: 9.7, memoryUsage: 45, storageUsage: 8, batteryDrain: 15, status: 'running', dangerLevel: 'moderate', description: 'GPS tracking in background, major battery drain', icon: 'location' },
  { id: '8', name: 'Bluetooth Manager', packageName: 'com.bluetooth.mgr', category: 'system', cpuUsage: 2.1, memoryUsage: 18, storageUsage: 4, batteryDrain: 5, status: 'running', dangerLevel: 'safe', description: 'Manages bluetooth connections', icon: 'bluetooth' },
  { id: '9', name: 'Weather Widget', packageName: 'com.weather.widget', category: 'user', cpuUsage: 4.5, memoryUsage: 52, storageUsage: 89, batteryDrain: 3, status: 'background', dangerLevel: 'moderate', description: 'Refreshes weather data every 30 minutes', icon: 'cloudy' },
  { id: '10', name: 'System UI', packageName: 'com.system.ui', category: 'system', cpuUsage: 5.2, memoryUsage: 96, storageUsage: 0, batteryDrain: 2, status: 'running', dangerLevel: 'safe', description: 'Core system interface - cannot be killed', icon: 'phone-portrait' },
  { id: '11', name: 'Keyboard Service', packageName: 'com.keyboard.srv', category: 'system', cpuUsage: 1.8, memoryUsage: 32, storageUsage: 24, batteryDrain: 1, status: 'running', dangerLevel: 'safe', description: 'Input method service', icon: 'keypad' },
  { id: '12', name: 'Data Sync Agent', packageName: 'com.sync.agent', category: 'bloatware', cpuUsage: 7.6, memoryUsage: 68, storageUsage: 156, batteryDrain: 9, status: 'background', dangerLevel: 'dangerous', description: 'Syncs data to unknown servers in background', icon: 'sync' },
];

export default function SecurityScreen() {
  const [apps, setApps] = useState<RunningApp[]>(SIMULATED_APPS);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanPhase, setScanPhase] = useState('');
  const [progress, setProgress] = useState(0);
  const [killedApps, setKilledApps] = useState<RunningApp[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedApp, setSelectedApp] = useState<RunningApp | null>(null);
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'danger'>('danger');
  const [totalMemoryFreed, setTotalMemoryFreed] = useState(0);
  const [totalCpuFreed, setTotalCpuFreed] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rocketY = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const checkmarkRotate = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    glow.start();

    return () => { pulse.stop(); glow.stop(); };
  }, []);

  const getSortedApps = () => {
    const sorted = [...apps];
    switch (sortBy) {
      case 'cpu': return sorted.sort((a, b) => b.cpuUsage - a.cpuUsage);
      case 'memory': return sorted.sort((a, b) => b.memoryUsage - a.memoryUsage);
      case 'danger': {
        const order = { dangerous: 3, moderate: 2, safe: 1 };
        return sorted.sort((a, b) => order[b.dangerLevel] - order[a.dangerLevel]);
      }
      default: return sorted;
    }
  };

  const startOptimization = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanComplete(false);
    setShowResults(false);
    setKilledApps([]);
    setTotalMemoryFreed(0);
    setTotalCpuFreed(0);

    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}

    // Rocket launch animation
    Animated.timing(rocketY, { toValue: -30, duration: 600, useNativeDriver: true }).start();

    const phases = [
      'Scanning running processes...',
      'Analyzing CPU usage...',
      'Detecting harmful apps...',
      'Checking memory allocation...',
      'Identifying bloatware...',
      'Killing dangerous processes...',
      'Clearing app caches...',
      'Freeing memory...',
      'Optimizing CPU threads...',
      'Finalizing cleanup...',
    ];

    const killable = apps.filter(a => a.dangerLevel !== 'safe' && a.status !== 'killed');
    let memFreed = 0;
    let cpuFreed = 0;
    const killed: RunningApp[] = [];

    for (let i = 0; i < phases.length; i++) {
      setScanPhase(phases[i]);
      const p = Math.round(((i + 1) / phases.length) * 100);
      setProgress(p);
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));

      if (i >= 4 && killed.length < killable.length) {
        const appToKill = killable[killed.length];
        killed.push(appToKill);
        memFreed += appToKill.memoryUsage;
        cpuFreed += appToKill.cpuUsage;
        setKilledApps([...killed]);
        setTotalMemoryFreed(memFreed);
        setTotalCpuFreed(Math.round(cpuFreed * 10) / 10);
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
    }

    // Update app states
    setApps(prev => prev.map(app => {
      if (killed.find(k => k.id === app.id)) {
        return { ...app, status: 'killed' as const };
      }
      return app;
    }));

    setIsScanning(false);
    setScanComplete(true);
    setShowResults(true);

    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}

    // Success animation
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      Animated.timing(checkmarkRotate, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(rocketY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const resetScan = () => {
    setScanComplete(false);
    setShowResults(false);
    setProgress(0);
    setKilledApps([]);
    setApps(SIMULATED_APPS);
    successScale.setValue(0);
    checkmarkRotate.setValue(0);
  };

  const getDangerColor = (level: string) => {
    switch (level) {
      case 'dangerous': return Colors.accent;
      case 'moderate': return Colors.warning;
      default: return Colors.success;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return Colors.success;
      case 'background': return Colors.warning;
      case 'idle': return Colors.textMuted;
      case 'killed': return Colors.accent;
      default: return Colors.textMuted;
    }
  };

  const totalCpu = apps.filter(a => a.status !== 'killed').reduce((acc, a) => acc + a.cpuUsage, 0);
  const totalMem = apps.filter(a => a.status !== 'killed').reduce((acc, a) => acc + a.memoryUsage, 0);
  const dangerousCount = apps.filter(a => a.dangerLevel === 'dangerous' && a.status !== 'killed').length;

  const checkmarkSpin = checkmarkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={[Colors.accent + '25', Colors.background]} style={styles.headerGradient}>
          <Text style={styles.headerTitle}>🛡️ Security Center</Text>
          <Text style={styles.headerSubtitle}>Detect & eliminate harmful background processes</Text>

          {/* Overview Stats */}
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewValue, { color: Colors.accent }]}>{dangerousCount}</Text>
              <Text style={styles.overviewLabel}>Threats</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewValue, { color: Colors.warning }]}>{apps.filter(a => a.status !== 'killed').length}</Text>
              <Text style={styles.overviewLabel}>Running</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewValue, { color: Colors.secondary }]}>{Math.round(totalCpu)}%</Text>
              <Text style={styles.overviewLabel}>CPU Used</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewValue, { color: Colors.primary }]}>{totalMem} MB</Text>
              <Text style={styles.overviewLabel}>RAM Used</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Rocket Button */}
        <View style={styles.rocketSection}>
          <Animated.View style={[styles.rocketOuter, { transform: [{ scale: isScanning ? 1 : pulseAnim }, { translateY: rocketY }] }]}>
            <TouchableOpacity onPress={isScanning ? undefined : scanComplete ? resetScan : startOptimization} activeOpacity={0.8}>
              <LinearGradient
                colors={scanComplete ? [Colors.success, '#00C853'] : isScanning ? [Colors.warning, '#FF9800'] : [Colors.accent, '#FF3D3D']}
                style={styles.rocketButton}
              >
                {scanComplete ? (
                  <Animated.View style={{ transform: [{ scale: successScale }, { rotate: checkmarkSpin }] }}>
                    <Ionicons name="checkmark-circle" size={60} color="#fff" />
                  </Animated.View>
                ) : (
                  <Ionicons name="rocket" size={56} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.rocketLabel}>
            {isScanning ? scanPhase : scanComplete ? '✅ All threats eliminated!' : 'Tap to Close All Harmful Apps'}
          </Text>

          {(isScanning || scanComplete) && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBg}>
                <LinearGradient
                  colors={scanComplete ? [Colors.success, Colors.secondary] : [Colors.accent, Colors.warning]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          )}
        </View>

        {/* Live Kill Feed */}
        {isScanning && killedApps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔴 Live Kill Feed</Text>
            {killedApps.map((app, i) => (
              <Animated.View key={app.id} style={styles.killFeedItem}>
                <Ionicons name="close-circle" size={18} color={Colors.accent} />
                <Text style={styles.killFeedText}>
                  <Text style={{ fontWeight: '700' }}>{app.name}</Text> killed — freed {app.memoryUsage} MB
                </Text>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Optimization Results */}
        {showResults && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Optimization Results</Text>
            <View style={styles.resultsGrid}>
              <GlassCard style={styles.resultCard}>
                <LinearGradient colors={[Colors.accent + '30', 'transparent']} style={styles.resultGlow} />
                <Ionicons name="close-circle" size={36} color={Colors.accent} />
                <Text style={styles.resultValue}>{killedApps.length}</Text>
                <Text style={styles.resultLabel}>Apps Killed</Text>
              </GlassCard>
              <GlassCard style={styles.resultCard}>
                <LinearGradient colors={[Colors.success + '30', 'transparent']} style={styles.resultGlow} />
                <Ionicons name="server" size={36} color={Colors.success} />
                <Text style={styles.resultValue}>{totalMemoryFreed} MB</Text>
                <Text style={styles.resultLabel}>Memory Freed</Text>
              </GlassCard>
              <GlassCard style={styles.resultCard}>
                <LinearGradient colors={[Colors.secondary + '30', 'transparent']} style={styles.resultGlow} />
                <Ionicons name="speedometer" size={36} color={Colors.secondary} />
                <Text style={styles.resultValue}>{totalCpuFreed}%</Text>
                <Text style={styles.resultLabel}>CPU Freed</Text>
              </GlassCard>
              <GlassCard style={styles.resultCard}>
                <LinearGradient colors={[Colors.primary + '30', 'transparent']} style={styles.resultGlow} />
                <Ionicons name="battery-charging" size={36} color={Colors.primary} />
                <Text style={styles.resultValue}>{killedApps.reduce((a, b) => a + b.batteryDrain, 0)}%</Text>
                <Text style={styles.resultLabel}>Battery Saved</Text>
              </GlassCard>
            </View>

            {/* Killed Apps Detailed List */}
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>🗑️ Apps Closed ({killedApps.length})</Text>
            {killedApps.map((app, index) => (
              <GlassCard key={app.id} style={styles.killedAppCard}>
                <View style={styles.killedAppHeader}>
                  <View style={[styles.appIcon, { backgroundColor: Colors.accent + '20' }]}>  
                    <Ionicons name={app.icon} size={22} color={Colors.accent} />
                  </View>
                  <View style={styles.killedAppInfo}>
                    <Text style={styles.killedAppName}>{app.name}</Text>
                    <Text style={styles.killedAppPkg}>{app.packageName}</Text>
                  </View>
                  <View style={styles.killedBadge}>
                    <Text style={styles.killedBadgeText}>KILLED</Text>
                  </View>
                </View>
                <Text style={styles.killedAppDesc}>{app.description}</Text>
                <View style={styles.killedAppStats}>
                  <View style={styles.killedStat}>
                    <Ionicons name="hardware-chip" size={14} color={Colors.secondary} />
                    <Text style={styles.killedStatText}>{app.cpuUsage}% CPU</Text>
                  </View>
                  <View style={styles.killedStat}>
                    <Ionicons name="server" size={14} color={Colors.primary} />
                    <Text style={styles.killedStatText}>{app.memoryUsage} MB RAM</Text>
                  </View>
                  <View style={styles.killedStat}>
                    <Ionicons name="folder" size={14} color={Colors.warning} />
                    <Text style={styles.killedStatText}>{app.storageUsage} MB</Text>
                  </View>
                  <View style={styles.killedStat}>
                    <Ionicons name="battery-dead" size={14} color={Colors.accent} />
                    <Text style={styles.killedStatText}>{app.batteryDrain}% drain</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Sort Tabs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 All Running Apps ({apps.filter(a => a.status !== 'killed').length})</Text>
          <View style={styles.sortTabs}>
            {[
              { key: 'danger' as const, label: 'By Threat', icon: 'shield' as const },
              { key: 'cpu' as const, label: 'By CPU', icon: 'hardware-chip' as const },
              { key: 'memory' as const, label: 'By RAM', icon: 'server' as const },
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.sortTab, sortBy === tab.key && styles.sortTabActive]}
                onPress={() => setSortBy(tab.key)}
              >
                <Ionicons name={tab.icon} size={14} color={sortBy === tab.key ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.sortTabText, sortBy === tab.key && styles.sortTabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App List */}
        <View style={[styles.section, { marginBottom: 100, marginTop: 0 }]}>
          {getSortedApps().map((app) => (
            <TouchableOpacity
              key={app.id}
              onPress={() => setSelectedApp(app)}
              activeOpacity={0.7}
            >
              <GlassCard style={[styles.appCard, app.status === 'killed' && styles.appCardKilled]}>
                <View style={styles.appHeader}>
                  <View style={[styles.appIcon, { backgroundColor: getDangerColor(app.dangerLevel) + '20' }]}>  
                    <Ionicons name={app.icon} size={20} color={getDangerColor(app.dangerLevel)} />
                  </View>
                  <View style={styles.appDetails}>
                    <View style={styles.appNameRow}>
                      <Text style={[styles.appName, app.status === 'killed' && styles.appNameKilled]}>{app.name}</Text>
                      <View style={[styles.dangerBadge, { backgroundColor: getDangerColor(app.dangerLevel) + '20' }]}>
                        <Text style={[styles.dangerBadgeText, { color: getDangerColor(app.dangerLevel) }]}>
                          {app.dangerLevel.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.appCategory}>{app.category} • {app.status === 'killed' ? 'killed' : app.status}</Text>
                  </View>
                </View>

                {/* Resource Bars */}
                <View style={styles.resourceBars}>
                  <View style={styles.resourceRow}>
                    <Text style={styles.resourceLabel}>CPU</Text>
                    <View style={styles.resourceBarBg}>
                      <View style={[styles.resourceBarFill, { width: `${Math.min(app.cpuUsage * 5, 100)}%`, backgroundColor: app.cpuUsage > 10 ? Colors.accent : Colors.secondary }]} />
                    </View>
                    <Text style={styles.resourceValue}>{app.cpuUsage}%</Text>
                  </View>
                  <View style={styles.resourceRow}>
                    <Text style={styles.resourceLabel}>RAM</Text>
                    <View style={styles.resourceBarBg}>
                      <View style={[styles.resourceBarFill, { width: `${Math.min(app.memoryUsage / 2, 100)}%`, backgroundColor: app.memoryUsage > 100 ? Colors.warning : Colors.primary }]} />
                    </View>
                    <Text style={styles.resourceValue}>{app.memoryUsage} MB</Text>
                  </View>
                </View>

                {/* Status indicator */}
                <View style={styles.appFooter}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(app.status) }]} />
                  <Text style={styles.statusText}>{app.status === 'killed' ? 'Process terminated' : `Battery drain: ${app.batteryDrain}%`}</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* App Detail Modal */}
      <Modal visible={!!selectedApp} transparent animationType="slide" onRequestClose={() => setSelectedApp(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedApp && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIcon, { backgroundColor: getDangerColor(selectedApp.dangerLevel) + '20' }]}>
                    <Ionicons name={selectedApp.icon} size={32} color={getDangerColor(selectedApp.dangerLevel)} />
                  </View>
                  <TouchableOpacity onPress={() => setSelectedApp(null)}>
                    <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTitle}>{selectedApp.name}</Text>
                <Text style={styles.modalPackage}>{selectedApp.packageName}</Text>
                <Text style={styles.modalDesc}>{selectedApp.description}</Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalSectionTitle}>Resource Usage</Text>
                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="hardware-chip" size={24} color={Colors.secondary} />
                    <Text style={styles.modalStatValue}>{selectedApp.cpuUsage}%</Text>
                    <Text style={styles.modalStatLabel}>CPU Usage</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="server" size={24} color={Colors.primary} />
                    <Text style={styles.modalStatValue}>{selectedApp.memoryUsage} MB</Text>
                    <Text style={styles.modalStatLabel}>Memory</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="folder" size={24} color={Colors.warning} />
                    <Text style={styles.modalStatValue}>{selectedApp.storageUsage} MB</Text>
                    <Text style={styles.modalStatLabel}>Storage</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="battery-dead" size={24} color={Colors.accent} />
                    <Text style={styles.modalStatValue}>{selectedApp.batteryDrain}%</Text>
                    <Text style={styles.modalStatLabel}>Battery</Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Category</Text>
                  <Text style={styles.modalInfoValue}>{selectedApp.category}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Status</Text>
                  <Text style={[styles.modalInfoValue, { color: getStatusColor(selectedApp.status) }]}>{selectedApp.status}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Threat Level</Text>
                  <Text style={[styles.modalInfoValue, { color: getDangerColor(selectedApp.dangerLevel) }]}>{selectedApp.dangerLevel}</Text>
                </View>

                {selectedApp.dangerLevel !== 'safe' && selectedApp.status !== 'killed' && (
                  <TouchableOpacity style={styles.killBtn} onPress={() => {
                    setApps(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: 'killed' as const } : a));
                    setSelectedApp(null);
                  }}>
                    <LinearGradient colors={[Colors.accent, '#FF3D3D']} style={styles.killBtnGradient}>
                      <Ionicons name="skull" size={20} color="#fff" />
                      <Text style={styles.killBtnText}>Kill This Process</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.title, fontWeight: '800' },
  headerSubtitle: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 4 },
  overviewRow: { flexDirection: 'row', marginTop: Spacing.lg, gap: Spacing.sm },
  overviewItem: { flex: 1, backgroundColor: Colors.glass, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.glassBorder },
  overviewValue: { fontSize: FontSize.xl, fontWeight: '800' },
  overviewLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  rocketSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  rocketOuter: { ...Shadows.glow, shadowColor: Colors.accent },
  rocketButton: { width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center', ...Shadows.glow, shadowColor: Colors.accent },
  rocketLabel: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600', marginTop: Spacing.md, textAlign: 'center', paddingHorizontal: Spacing.xl },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, paddingHorizontal: Spacing.xl, width: '100%', gap: Spacing.md },
  progressBg: { flex: 1, height: 8, backgroundColor: Colors.card, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700', width: 45, textAlign: 'right' },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
  killFeedItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6, paddingHorizontal: Spacing.md, backgroundColor: Colors.accent + '10', borderRadius: BorderRadius.sm, marginBottom: 4, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  killFeedText: { color: Colors.textPrimary, fontSize: FontSize.sm, flex: 1 },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  resultCard: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2 - 0.5, alignItems: 'center', gap: Spacing.xs, overflow: 'hidden' },
  resultGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, borderRadius: BorderRadius.lg },
  resultValue: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900' },
  resultLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  killedAppCard: { marginBottom: Spacing.sm },
  killedAppHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  killedAppInfo: { flex: 1 },
  killedAppName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
  killedAppPkg: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 1 },
  killedBadge: { backgroundColor: Colors.accent + '20', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.accent + '40' },
  killedBadgeText: { color: Colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  killedAppDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm, lineHeight: 18 },
  killedAppStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  killedStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  killedStatText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  sortTabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  sortTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.sm, borderRadius: BorderRadius.xl, backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder },
  sortTabActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary + '40' },
  sortTabText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  sortTabTextActive: { color: Colors.primary },
  appCard: { marginBottom: Spacing.sm },
  appCardKilled: { opacity: 0.5 },
  appHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  appIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appDetails: { flex: 1 },
  appNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  appName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700', flex: 1 },
  appNameKilled: { textDecorationLine: 'line-through', color: Colors.textMuted },
  appCategory: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  dangerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  dangerBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  resourceBars: { gap: 6, marginBottom: Spacing.sm },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  resourceLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', width: 28, textTransform: 'uppercase' },
  resourceBarBg: { flex: 1, height: 5, backgroundColor: Colors.card, borderRadius: 2.5, overflow: 'hidden' },
  resourceBarFill: { height: '100%', borderRadius: 2.5 },
  resourceValue: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600', width: 55, textAlign: 'right' },
  appFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: Colors.textMuted, fontSize: FontSize.xs },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '800' },
  modalPackage: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  modalDesc: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.sm, lineHeight: 22 },
  modalDivider: { height: 1, backgroundColor: Colors.glassBorder, marginVertical: Spacing.lg },
  modalSectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
  modalStats: { flexDirection: 'row', gap: Spacing.md },
  modalStatItem: { flex: 1, alignItems: 'center', gap: 4 },
  modalStatValue: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800' },
  modalStatLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  modalInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  modalInfoLabel: { color: Colors.textSecondary, fontSize: FontSize.md },
  modalInfoValue: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
  killBtn: { marginTop: Spacing.lg },
  killBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: BorderRadius.xl },
  killBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '800' },
});
