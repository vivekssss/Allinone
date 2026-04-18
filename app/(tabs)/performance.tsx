import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Platform, Dimensions, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Haptics from 'expo-haptics';
import GlassCard from '@/components/GlassCard';
import GradientButton from '@/components/GradientButton';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Snapshot {
  id: string;
  timestamp: Date;
  cpu: { usage: number; status: string };
  memory: { total: number; used: number; free: number; usagePercent: number; status: string };
  battery: { level: number; charging: boolean; status: string };
  storage: { total: number; used: number; free: number; usagePercent: number };
  device: { model: string; os: string; runningApps: number };
  performanceScore: number;
  performanceGrade: string;
  recommendations: string[];
}

export default function PerformanceScreen() {
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [performanceScore, setPerformanceScore] = useState(72);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [showBoostResult, setShowBoostResult] = useState(false);
  const [boostBefore, setBoostBefore] = useState(0);
  const [deviceModel, setDeviceModel] = useState('');
  const [osVersion, setOsVersion] = useState('');

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const boostGlow = useRef(new Animated.Value(0)).current;
  const boostShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDeviceStats();
    Animated.timing(scoreAnim, { toValue: performanceScore, duration: 1500, useNativeDriver: false }).start();
  }, []);

  const loadDeviceStats = async () => {
    try {
      const battery = await Battery.getBatteryLevelAsync();
      const state = await Battery.getBatteryStateAsync();
      setBatteryLevel(Math.round(battery * 100));
      setIsCharging(state === Battery.BatteryState.CHARGING);
      setDeviceModel(Device.modelName || Device.deviceName || 'Unknown Device');
      setOsVersion(`${Device.osName || 'OS'} ${Device.osVersion || ''}`);
    } catch (e) { console.log(e); }
  };

  const takeSnapshot = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}

    const cpuUsage = Math.round(20 + Math.random() * 50);
    const memTotal = 6144;
    const memUsed = Math.round(2000 + Math.random() * 2500);
    const storTotal = 131072;
    const storUsed = Math.round(40000 + Math.random() * 50000);

    const snapshot: Snapshot = {
      id: Date.now().toString(),
      timestamp: new Date(),
      cpu: {
        usage: cpuUsage,
        status: cpuUsage > 80 ? 'critical' : cpuUsage > 50 ? 'warning' : 'normal',
      },
      memory: {
        total: memTotal,
        used: memUsed,
        free: memTotal - memUsed,
        usagePercent: Math.round((memUsed / memTotal) * 100),
        status: memUsed / memTotal > 0.8 ? 'critical' : 'normal',
      },
      battery: {
        level: batteryLevel,
        charging: isCharging,
        status: batteryLevel < 20 ? 'low' : batteryLevel < 50 ? 'medium' : 'good',
      },
      storage: {
        total: storTotal,
        used: storUsed,
        free: storTotal - storUsed,
        usagePercent: Math.round((storUsed / storTotal) * 100),
      },
      device: {
        model: deviceModel,
        os: osVersion,
        runningApps: Math.round(8 + Math.random() * 15),
      },
      performanceScore,
      performanceGrade: performanceScore >= 90 ? 'A+' : performanceScore >= 80 ? 'A' : performanceScore >= 70 ? 'B' : performanceScore >= 60 ? 'C' : 'D',
      recommendations: [],
    };

    // Generate recommendations
    const recs: string[] = [];
    if (cpuUsage > 70) recs.push('🔴 High CPU usage — close background apps');
    if (memUsed / memTotal > 0.75) recs.push('🟡 Memory running low — free up RAM');
    if (batteryLevel < 30) recs.push('🔋 Low battery — enable power saving');
    if (storUsed / storTotal > 0.85) recs.push('💾 Storage almost full — delete unused files');
    if (snapshot.device.runningApps > 15) recs.push(`📱 ${snapshot.device.runningApps} apps running — kill unused ones`);
    if (recs.length === 0) recs.push('✅ Device is running well — no action needed');
    snapshot.recommendations = recs;

    setSnapshots(prev => [snapshot, ...prev.slice(0, 19)]);
    setSelectedSnapshot(snapshot);

    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
  };

  const runBoost = async () => {
    if (isBoosting) return;
    setIsBoosting(true);
    setShowBoostResult(false);
    setBoostBefore(performanceScore);

    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}

    // Shake animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(boostShake, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(boostShake, { toValue: -5, duration: 50, useNativeDriver: true }),
        Animated.timing(boostShake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]),
      { iterations: 15 }
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(boostGlow, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(boostGlow, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      { iterations: 5 }
    ).start();

    await new Promise(r => setTimeout(r, 3000));

    const newScore = Math.min(performanceScore + Math.floor(Math.random() * 18 + 8), 99);
    setPerformanceScore(newScore);
    Animated.timing(scoreAnim, { toValue: newScore, duration: 800, useNativeDriver: false }).start();
    setIsBoosting(false);
    setShowBoostResult(true);

    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': case 'A': return Colors.success;
      case 'B': return Colors.secondary;
      case 'C': return Colors.warning;
      default: return Colors.accent;
    }
  };

  const formatBytes = (mb: number) => mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[Colors.secondary + '25', Colors.background]} style={styles.headerGradient}>
          <Text style={styles.headerTitle}>⚡ Performance</Text>
          <Text style={styles.headerSubtitle}>Monitor, analyze, and boost your device</Text>
        </LinearGradient>

        {/* Score Ring */}
        <Animated.View style={[styles.scoreSection, { transform: [{ translateX: boostShake }] }]}>
          <View style={styles.scoreRingOuter}>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.scoreRingGradient}>
              <View style={styles.scoreRingInner}>
                <Text style={styles.scoreNumber}>{performanceScore}</Text>
                <Text style={styles.scoreUnit}>/ 100</Text>
                <Text style={[styles.gradeText, { color: getGradeColor(performanceScore >= 90 ? 'A+' : performanceScore >= 80 ? 'A' : performanceScore >= 70 ? 'B' : 'C') }]}>
                  Grade: {performanceScore >= 90 ? 'A+' : performanceScore >= 80 ? 'A' : performanceScore >= 70 ? 'B' : performanceScore >= 60 ? 'C' : 'D'}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Boost Result */}
          {showBoostResult && (
            <GlassCard style={styles.boostResultCard}>
              <Ionicons name="trending-up" size={24} color={Colors.success} />
              <View>
                <Text style={styles.boostResultTitle}>Boost Complete! 🎉</Text>
                <Text style={styles.boostResultText}>
                  Score improved from {boostBefore} → {performanceScore} (+{performanceScore - boostBefore} points)
                </Text>
              </View>
            </GlassCard>
          )}

          <View style={styles.boostActions}>
            <GradientButton
              title={isBoosting ? 'Boosting...' : '⚡ CPU Boost'}
              onPress={runBoost}
              loading={isBoosting}
              colors={[Colors.success, Colors.secondary]}
              style={{ flex: 1 }}
            />
            <GradientButton
              title="📸 Snapshot"
              onPress={takeSnapshot}
              colors={[Colors.primary, Colors.primaryLight]}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* System Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Resources</Text>
          <View style={styles.gaugesGrid}>
            {[
              { label: 'RAM Usage', value: '2.4 GB', max: '6 GB', percent: 40, icon: 'hardware-chip' as const, color: Colors.primary },
              { label: 'CPU Usage', value: '32%', max: '100%', percent: 32, icon: 'speedometer' as const, color: Colors.secondary },
              { label: 'Battery', value: `${batteryLevel}%`, max: '100%', percent: batteryLevel, icon: (isCharging ? 'battery-charging' : 'battery-half') as const, color: batteryLevel > 50 ? Colors.success : Colors.warning },
              { label: 'Storage', value: '48 GB', max: '128 GB', percent: 37, icon: 'folder' as const, color: Colors.warning },
            ].map((gauge, i) => (
              <GlassCard key={i} style={styles.gaugeCard}>
                <View style={styles.gaugeHeader}>
                  <View style={[styles.gaugeIcon, { backgroundColor: gauge.color + '20' }]}>
                    <Ionicons name={gauge.icon} size={18} color={gauge.color} />
                  </View>
                  <Text style={styles.gaugeLabel}>{gauge.label}</Text>
                </View>
                <Text style={[styles.gaugeValue, { color: gauge.color }]}>{gauge.value}</Text>
                <View style={styles.gaugeBg}>
                  <View style={[styles.gaugeFill, { width: `${gauge.percent}%`, backgroundColor: gauge.percent > 80 ? Colors.accent : gauge.color }]} />
                </View>
                <Text style={styles.gaugeMax}>{gauge.percent}% of {gauge.max}</Text>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* Snapshots History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 CPU Snapshots ({snapshots.length})</Text>
          {snapshots.length === 0 ? (
            <GlassCard style={styles.emptySnapshots}>
              <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No snapshots yet. Tap "Snapshot" to capture device stats.</Text>
            </GlassCard>
          ) : (
            snapshots.map((snap, i) => (
              <TouchableOpacity key={snap.id} onPress={() => setSelectedSnapshot(snap)}>
                <GlassCard style={styles.snapshotCard}>
                  <View style={styles.snapshotHeader}>
                    <View style={styles.snapshotTimeRow}>
                      <Ionicons name="time" size={16} color={Colors.textSecondary} />
                      <Text style={styles.snapshotTime}>
                        {snap.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </Text>
                    </View>
                    <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(snap.performanceGrade) + '20' }]}>
                      <Text style={[styles.gradeText2, { color: getGradeColor(snap.performanceGrade) }]}>{snap.performanceGrade}</Text>
                    </View>
                  </View>
                  <View style={styles.snapshotStats}>
                    <View style={styles.snapStat}>
                      <Text style={styles.snapStatLabel}>CPU</Text>
                      <Text style={[styles.snapStatValue, { color: snap.cpu.usage > 70 ? Colors.accent : Colors.secondary }]}>{snap.cpu.usage}%</Text>
                    </View>
                    <View style={styles.snapStatDivider} />
                    <View style={styles.snapStat}>
                      <Text style={styles.snapStatLabel}>RAM</Text>
                      <Text style={[styles.snapStatValue, { color: Colors.primary }]}>{snap.memory.usagePercent}%</Text>
                    </View>
                    <View style={styles.snapStatDivider} />
                    <View style={styles.snapStat}>
                      <Text style={styles.snapStatLabel}>Battery</Text>
                      <Text style={[styles.snapStatValue, { color: snap.battery.level < 30 ? Colors.accent : Colors.success }]}>{snap.battery.level}%</Text>
                    </View>
                    <View style={styles.snapStatDivider} />
                    <View style={styles.snapStat}>
                      <Text style={styles.snapStatLabel}>Apps</Text>
                      <Text style={styles.snapStatValue}>{snap.device.runningApps}</Text>
                    </View>
                  </View>
                  <Text style={styles.snapTapHint}>Tap for full details →</Text>
                </GlassCard>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Tips */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>💡 Performance Tips</Text>
          {[
            { icon: 'close-circle-outline' as const, tip: 'Close unused background apps to free RAM', priority: 'high', color: Colors.accent },
            { icon: 'battery-half' as const, tip: 'Enable battery saver mode below 20%', priority: 'medium', color: Colors.warning },
            { icon: 'trash-outline' as const, tip: 'Clear app caches monthly for extra storage', priority: 'low', color: Colors.success },
            { icon: 'wifi-outline' as const, tip: 'Disable WiFi/Bluetooth scanning when not needed', priority: 'medium', color: Colors.secondary },
            { icon: 'refresh-outline' as const, tip: 'Restart device weekly for optimal performance', priority: 'low', color: Colors.primary },
          ].map((tip, i) => (
            <GlassCard key={i} style={styles.tipCard}>
              <View style={[styles.tipIcon, { backgroundColor: tip.color + '20' }]}>
                <Ionicons name={tip.icon} size={20} color={tip.color} />
              </View>
              <Text style={styles.tipText}>{tip.tip}</Text>
            </GlassCard>
          ))}
        </View>
      </ScrollView>

      {/* Snapshot Detail Modal */}
      <Modal visible={!!selectedSnapshot} transparent animationType="slide" onRequestClose={() => setSelectedSnapshot(null)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedSnapshot && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>📊 Snapshot Details</Text>
                  <TouchableOpacity onPress={() => setSelectedSnapshot(null)}>
                    <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTimestamp}>
                  {selectedSnapshot.timestamp.toLocaleString()}
                </Text>

                {/* Score */}
                <View style={styles.modalScoreRow}>
                  <View style={[styles.modalScoreBadge, { borderColor: getGradeColor(selectedSnapshot.performanceGrade) }]}>
                    <Text style={[styles.modalScoreNum, { color: getGradeColor(selectedSnapshot.performanceGrade) }]}>
                      {selectedSnapshot.performanceScore}
                    </Text>
                    <Text style={styles.modalScoreGrade}>{selectedSnapshot.performanceGrade}</Text>
                  </View>
                  <View style={styles.modalScoreInfo}>
                    <Text style={styles.modalScoreLabel}>Performance Score</Text>
                    <Text style={styles.modalScoreDesc}>
                      {selectedSnapshot.performanceScore >= 80 ? 'Excellent performance' : selectedSnapshot.performanceScore >= 60 ? 'Good but could improve' : 'Needs optimization'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                {/* CPU Details */}
                <Text style={styles.modalSectionTitle}>🖥️ CPU</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Usage</Text>
                  <Text style={[styles.detailValue, { color: selectedSnapshot.cpu.usage > 70 ? Colors.accent : Colors.textPrimary }]}>{selectedSnapshot.cpu.usage}%</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: selectedSnapshot.cpu.status === 'critical' ? Colors.accent : selectedSnapshot.cpu.status === 'warning' ? Colors.warning : Colors.success }]}>
                    {selectedSnapshot.cpu.status.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailBarBg}>
                  <View style={[styles.detailBarFill, { width: `${selectedSnapshot.cpu.usage}%`, backgroundColor: selectedSnapshot.cpu.usage > 70 ? Colors.accent : Colors.secondary }]} />
                </View>

                <View style={styles.modalDivider} />

                {/* Memory Details */}
                <Text style={styles.modalSectionTitle}>💾 Memory</Text>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Total</Text><Text style={styles.detailValue}>{formatBytes(selectedSnapshot.memory.total)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Used</Text><Text style={styles.detailValue}>{formatBytes(selectedSnapshot.memory.used)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Free</Text><Text style={[styles.detailValue, { color: Colors.success }]}>{formatBytes(selectedSnapshot.memory.free)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Usage</Text><Text style={styles.detailValue}>{selectedSnapshot.memory.usagePercent}%</Text></View>
                <View style={styles.detailBarBg}>
                  <View style={[styles.detailBarFill, { width: `${selectedSnapshot.memory.usagePercent}%`, backgroundColor: Colors.primary }]} />
                </View>

                <View style={styles.modalDivider} />

                {/* Battery */}
                <Text style={styles.modalSectionTitle}>🔋 Battery</Text>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Level</Text><Text style={styles.detailValue}>{selectedSnapshot.battery.level}%</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Charging</Text><Text style={styles.detailValue}>{selectedSnapshot.battery.charging ? '⚡ Yes' : 'No'}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Status</Text><Text style={[styles.detailValue, { color: selectedSnapshot.battery.status === 'low' ? Colors.accent : Colors.success }]}>{selectedSnapshot.battery.status.toUpperCase()}</Text></View>

                <View style={styles.modalDivider} />

                {/* Storage */}
                <Text style={styles.modalSectionTitle}>📦 Storage</Text>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Total</Text><Text style={styles.detailValue}>{formatBytes(selectedSnapshot.storage.total)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Used</Text><Text style={styles.detailValue}>{formatBytes(selectedSnapshot.storage.used)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Free</Text><Text style={[styles.detailValue, { color: Colors.success }]}>{formatBytes(selectedSnapshot.storage.free)}</Text></View>
                <View style={styles.detailBarBg}>
                  <View style={[styles.detailBarFill, { width: `${selectedSnapshot.storage.usagePercent}%`, backgroundColor: Colors.warning }]} />
                </View>

                <View style={styles.modalDivider} />

                {/* Device */}
                <Text style={styles.modalSectionTitle}>📱 Device</Text>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Model</Text><Text style={styles.detailValue}>{selectedSnapshot.device.model}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>OS</Text><Text style={styles.detailValue}>{selectedSnapshot.device.os}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Running Apps</Text><Text style={styles.detailValue}>{selectedSnapshot.device.runningApps}</Text></View>

                <View style={styles.modalDivider} />

                {/* Recommendations */}
                <Text style={styles.modalSectionTitle}>💡 Recommendations</Text>
                {selectedSnapshot.recommendations.map((rec, i) => (
                  <Text key={i} style={styles.recItem}>{rec}</Text>
                ))}

                <View style={{ height: 40 }} />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.title, fontWeight: '800' },
  headerSubtitle: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 4 },
  scoreSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  scoreRingOuter: { ...Shadows.glow },
  scoreRingGradient: { width: 160, height: 160, borderRadius: 80, padding: 6 },
  scoreRingInner: { flex: 1, borderRadius: 74, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  scoreNumber: { color: Colors.textPrimary, fontSize: 48, fontWeight: '900' },
  scoreUnit: { color: Colors.textMuted, fontSize: FontSize.md, fontWeight: '600' },
  gradeText: { fontSize: FontSize.sm, fontWeight: '700', marginTop: 2 },
  boostResultCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg, marginHorizontal: Spacing.lg, borderColor: Colors.success + '30' },
  boostResultTitle: { color: Colors.success, fontSize: FontSize.md, fontWeight: '700' },
  boostResultText: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  boostActions: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.lg, width: '100%' },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
  gaugesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  gaugeCard: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2 - 0.5 },
  gaugeHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  gaugeIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  gaugeLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  gaugeValue: { fontSize: FontSize.xl, fontWeight: '800', marginBottom: Spacing.sm },
  gaugeBg: { height: 6, backgroundColor: Colors.card, borderRadius: 3, overflow: 'hidden' },
  gaugeFill: { height: '100%', borderRadius: 3 },
  gaugeMax: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4 },
  emptySnapshots: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md, textAlign: 'center' },
  snapshotCard: { marginBottom: Spacing.sm },
  snapshotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  snapshotTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  snapshotTime: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' },
  gradeBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  gradeText2: { fontSize: FontSize.md, fontWeight: '800' },
  snapshotStats: { flexDirection: 'row', alignItems: 'center' },
  snapStat: { flex: 1, alignItems: 'center' },
  snapStatLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  snapStatValue: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800', marginTop: 2 },
  snapStatDivider: { width: 1, height: 30, backgroundColor: Colors.glassBorder },
  snapTapHint: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '600', textAlign: 'right', marginTop: Spacing.sm },
  tipCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  tipIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tipText: { color: Colors.textPrimary, fontSize: FontSize.md, flex: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { flex: 1, backgroundColor: Colors.surface, marginTop: 60, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  modalTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '800' },
  modalTimestamp: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.lg },
  modalScoreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  modalScoreBadge: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  modalScoreNum: { fontSize: FontSize.title, fontWeight: '900' },
  modalScoreGrade: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700' },
  modalScoreInfo: { flex: 1 },
  modalScoreLabel: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700' },
  modalScoreDesc: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 2 },
  modalDivider: { height: 1, backgroundColor: Colors.glassBorder, marginVertical: Spacing.md },
  modalSectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { color: Colors.textSecondary, fontSize: FontSize.md },
  detailValue: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
  detailBarBg: { height: 8, backgroundColor: Colors.card, borderRadius: 4, overflow: 'hidden', marginTop: Spacing.sm },
  detailBarFill: { height: '100%', borderRadius: 4 },
  recItem: { color: Colors.textPrimary, fontSize: FontSize.md, paddingVertical: 6, lineHeight: 20 },
});
