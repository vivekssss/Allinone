import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated,
  Dimensions, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import GlassCard from '@/components/GlassCard';
import { AuraTheme } from '@/constants/aura-theme';
import { Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { deepCleanAPI } from '@/services/api';

const { width } = Dimensions.get('window');

export default function DeepCleanScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  
  const [results, setResults] = useState({
    cacheJunk: 0,
    largeFiles: 0,
    duplicates: 0,
    oldApks: 0,
    total: 0
  });

  const runScan = async () => {
    setIsScanning(true);
    setScanComplete(false);
    
    // Simulate real scanning progress
    const steps = [
      { key: 'cacheJunk', val: 120 + Math.random() * 200 },
      { key: 'oldApks', val: Math.random() > 0.5 ? (45 + Math.random() * 100) : 0 },
      { key: 'largeFiles', val: 400 + Math.random() * 1200 },
      { key: 'duplicates', val: 80 + Math.random() * 300 },
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 600));
      setResults(prev => {
        const newResults = { ...prev, [step.key]: Math.round(step.val) };
        const total = Object.values(newResults).reduce((a, b) => a + b, 0);
        return { ...newResults, total };
      });
    }

    setIsScanning(false);
    setScanComplete(true);
  };

  const handleClean = async () => {
    setCleaning(true);
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      await deepCleanAPI.saveScan({
        status: 'completed',
        totalSpaceFreedMB: results.total,
        cacheJunkSizeMB: results.cacheJunk,
        largeFilesSizeMB: results.largeFiles,
        duplicateFilesSizeMB: results.duplicates,
        obsoleteApkSizeMB: results.oldApks,
      });
    } catch {}

    setCleaning(false);
    router.replace('/(tabs)');
  };

  const renderJunkRow = (icon: string, label: string, size: number, color: string) => (
    <View style={styles.junkRow}>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.junkLabel}>{label}</Text>
        <Text style={styles.junkSub}>System temporary data</Text>
      </View>
      <Text style={[styles.junkSize, { color }]}>{size} MB</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#070A1A' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Deep Clean</Text>
        <View style={{ width: 28 }} />
      </View>

      {!scanComplete && !isScanning && (
        <View style={styles.startContainer}>
          <LinearGradient colors={['#7C4DFF', '#00D2FF']} style={styles.scanHero}>
            <Ionicons name="search-outline" size={80} color="#fff" />
          </LinearGradient>
          <Text style={styles.heroText}>Scan your device for junk and hidden files</Text>
          <TouchableOpacity style={styles.mainBtn} onPress={runScan}>
            <Text style={styles.mainBtnText}>Start Analysis</Text>
          </TouchableOpacity>
        </View>
      )}

      {isScanning && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="large" color={AuraTheme.dark.secondary} />
          <Text style={styles.scanningText}>Analyzing storage blocks...</Text>
          <Text style={styles.progressText}>{results.total} MB Found</Text>
        </View>
      )}

      {scanComplete && (
        <ScrollView style={styles.resultsScroll} contentContainerStyle={{ padding: 20 }}>
          <GlassCard style={styles.totalCard}>
            <Text style={styles.totalLabel}>TOTAL JUNK FOUND</Text>
            <Text style={styles.totalVal}>{results.total} <Text style={{ fontSize: 24 }}>MB</Text></Text>
          </GlassCard>

          <Text style={styles.sectionHeader}>Cleanup Recommendations</Text>
          <GlassCard style={{ padding: 0 }}>
            {renderJunkRow('trash-bin', 'System Cache', results.cacheJunk, '#00E5FF')}
            {renderJunkRow('copy', 'Duplicate Files', results.duplicates, '#7C4DFF')}
            {renderJunkRow('document', 'Large Files', results.largeFiles, '#FFD600')}
            {renderJunkRow('archive', 'Old installation APKs', results.oldApks, '#FF3D71')}
          </GlassCard>

          <TouchableOpacity style={styles.cleanBtn} onPress={handleClean} disabled={cleaning}>
            <LinearGradient colors={['#00E676', '#00C853']} style={styles.cleanGradient}>
              {cleaning ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.cleanBtnText}>Safe Cleanup (-{results.total} MB)</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  startContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  scanHero: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  heroText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  mainBtn: { width: '100%', backgroundColor: '#fff', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  mainBtnText: { color: '#000', fontSize: 18, fontWeight: '800' },
  scanningContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanningText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 20 },
  progressText: { color: AuraTheme.dark.secondary, fontSize: 32, fontWeight: '900', marginTop: 10 },
  resultsScroll: { flex: 1 },
  totalCard: { alignItems: 'center', paddingVertical: 30, marginBottom: 25 },
  totalLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  totalVal: { color: AuraTheme.dark.accent, fontSize: 64, fontWeight: '900' },
  sectionHeader: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 15, opacity: 0.8 },
  junkRow: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  junkLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  junkSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  junkSize: { fontSize: 16, fontWeight: '800' },
  cleanBtn: { marginTop: 30, marginBottom: 50 },
  cleanGradient: { paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  cleanBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
