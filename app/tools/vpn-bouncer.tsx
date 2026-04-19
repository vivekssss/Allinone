import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Image, Platform, Switch, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import GlassCard from '@/components/GlassCard';
import { AuraTheme } from '@/constants/aura-theme';
import { Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

const locations = [
  { id: 'us', name: 'United States', city: 'San Francisco', flag: '🇺🇸', ping: '42ms', load: '32%' },
  { id: 'uk', name: 'United Kingdom', city: 'London', flag: '🇬🇧', ping: '128ms', load: '65%' },
  { id: 'jp', name: 'Japan', city: 'Tokyo', flag: '🇯🇵', ping: '210ms', load: '12%' },
  { id: 'de', name: 'Germany', city: 'Frankfurt', flag: '🇩🇪', ping: '95ms', load: '48%' },
  { id: 'in', name: 'India', city: 'Mumbai', flag: '🇮🇳', ping: '15ms', load: '82%' },
  { id: 'ca', name: 'Canada', city: 'Toronto', flag: '🇨🇦', ping: '55ms', load: '22%' },
];

export default function VpnBouncer() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(locations[0]);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isConnected) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const toggleConnection = () => {
    if (isConnected) {
      setIsConnected(false);
    } else {
      setIsConnecting(true);
      setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
      }, 2500);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#070A1A' }]}>
      <LinearGradient colors={['#1e2961', '#070A1A']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>IP Bouncer</Text>
          <Ionicons name="settings-sharp" size={24} color="#fff" />
        </View>

        <View style={styles.connectionHub}>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>STATUS</Text>
            <Text style={[styles.statusVal, { color: isConnected ? '#00E676' : isConnecting ? '#FFD600' : 'rgba(255,255,255,0.4)' }]}>
              {isConnected ? 'PROTECTED' : isConnecting ? 'BOUNCING...' : 'DISCONNECTED'}
            </Text>
          </View>
          <Text style={styles.timer}>{formatTime(timer)}</Text>
          <TouchableOpacity onPress={toggleConnection} disabled={isConnecting}>
            <LinearGradient 
              colors={isConnected ? ['#FF1744', '#B00020'] : ['#7C4DFF', '#651FFF']} 
              style={styles.powerBtn}
            >
              {isConnecting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="power" size={42} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.currentIpCard}>
          <View style={styles.ipRow}>
            <View>
              <Text style={styles.ipLabel}>VIRTUAL IP</Text>
              <Text style={styles.ipText}>{isConnected ? `104.28.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}` : '192.168.1.1'}</Text>
            </View>
            <View style={styles.locationBadge}>
              <Text style={styles.flagLarge}>{selectedLoc.flag}</Text>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>Bouncer Nodes</Text>
        {locations.map((loc) => (
          <TouchableOpacity 
            key={loc.id} 
            onPress={() => !isConnecting && setSelectedLoc(loc)}
            activeOpacity={0.7}
          >
            <GlassCard style={[styles.locCard, selectedLoc.id === loc.id && styles.activeLoc]}>
              <Text style={styles.flagSmall}>{loc.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.locName}>{loc.name}</Text>
                <Text style={styles.locCity}>{loc.city}</Text>
              </View>
              <View style={styles.locStats}>
                <View style={styles.pingRow}>
                  <Ionicons name="pulse" size={14} color={parseInt(loc.ping) < 100 ? '#00E676' : '#FFD600'} />
                  <Text style={styles.pingText}>{loc.ping}</Text>
                </View>
                <Text style={styles.loadText}>Load: {loc.load}</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  connectionHub: { alignItems: 'center' },
  statusBox: { alignItems: 'center', marginBottom: 10 },
  statusLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statusVal: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  timer: { color: '#fff', fontSize: 48, fontWeight: '300', marginBottom: 30, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  powerBtn: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', ...Shadows.card },
  content: { padding: 20 },
  currentIpCard: { padding: 20, marginBottom: 30 },
  ipRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ipLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' },
  ipText: { color: AuraTheme.dark.secondary, fontSize: 22, fontWeight: '800', marginTop: 4 },
  locationBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  flagLarge: { fontSize: 28 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 15, opacity: 0.8 },
  locCard: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 12, gap: 15 },
  activeLoc: { borderColor: '#7C4DFF', borderWidth: 1 },
  flagSmall: { fontSize: 24 },
  locName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  locCity: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  locStats: { alignItems: 'flex-end' },
  pingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pingText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  loadText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 },
});
