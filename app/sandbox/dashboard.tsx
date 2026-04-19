import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Image, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import GlassCard from '@/components/GlassCard';
import { useTheme } from '@/constants/ThemeContext';
import { AuraTheme } from '@/constants/aura-theme';
import { Spacing, FontSize, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function SandboxDashboard() {
  const router = useRouter();
  const { colors } = useTheme();
  const [booting, setBooting] = useState(true);
  const [activeApps, setActiveApps] = useState<any[]>([]);

  useEffect(() => {
    // Simulate OS Booting
    setTimeout(() => setBooting(false), 1500);
  }, []);

  const internalApps = [
    { id: 'browser', name: 'Secure Browser', icon: 'globe', color: '#00D2FF', package: 'system.browser' },
    { id: 'terminal', name: 'API Interceptor', icon: 'code-working', color: '#6C5CE7', package: 'system.interceptor', route: '/sandbox/interceptor' },
    { id: 'vault', name: 'Encrypted Vault', icon: 'lock-closed', color: '#FF6B6B', package: 'system.vault' },
    { id: 'proxy', name: 'IP Bouncer', icon: 'shield-checkmark', color: '#00E676', package: 'system.proxy' },
  ];

  if (booting) {
    return (
      <View style={[styles.bootContainer, { backgroundColor: '#070A1A' }]}>
        <ActivityIndicator size="large" color={AuraTheme.dark.primary} />
        <Text style={styles.bootText}>Initializing Virtual Environment...</Text>
        <Text style={styles.bootSub}>Loading Secure Kernel 4.2.0</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: AuraTheme.dark.background }]}>
      <LinearGradient colors={['#1A2151', '#070A1A']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="apps" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Private Sandbox</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ENCRYPTED</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Isolated Applications</Text>
        <View style={styles.grid}>
          {internalApps.map((app) => (
            <TouchableOpacity 
              key={app.id} 
              style={styles.appCard}
              onPress={() => app.route ? router.push(app.route as any) : null}
            >
              <GlassCard style={styles.appCardInner}>
                <LinearGradient 
                  colors={[app.color + '40', 'transparent']} 
                  style={styles.iconBg}
                >
                  <Ionicons name={app.icon as any} size={32} color={app.color} />
                </LinearGradient>
                <Text style={styles.appName}>{app.name}</Text>
                <Text style={styles.appPackage}>{app.package}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        <GlassCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color={AuraTheme.dark.secondary} />
            <Text style={styles.infoText}>
              Applications running here are isolated from the host OS. All traffic is routed through the internal Interceptor.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bootContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bootText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 20 },
  bootSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,230,118,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00E676', marginRight: 6 },
  statusText: { color: '#00E676', fontSize: 10, fontWeight: '800' },
  content: { padding: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20, opacity: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  appCard: { width: (width - 40 - 15) / 2 },
  appCardInner: { alignItems: 'center', padding: 20 },
  iconBg: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  appName: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  appPackage: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 },
  infoCard: { marginTop: 30, padding: 15 },
  infoRow: { flexDirection: 'row', gap: 10 },
  infoText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18, flex: 1 },
});
