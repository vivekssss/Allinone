import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated,
  Dimensions, TextInput, Switch, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import GlassCard from '@/components/GlassCard';
import { AuraTheme } from '@/constants/aura-theme';
import { Spacing, FontSize, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface ApiLog {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  status: 'pending' | 'intercepted' | 'completed' | 'dropped';
  timestamp: string;
  delay: number;
  payload?: any;
}

export default function ApiInterceptor() {
  const router = useRouter();
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [autoIntercept, setAutoIntercept] = useState(true);
  const [globalDelay, setGlobalDelay] = useState(2);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Generate mock traffic
    const interval = setInterval(() => {
      if (logs.length < 50) {
        addMockLog();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [logs]);

  const addMockLog = () => {
    const endpoints = [
      '/api/v1/auth/login',
      '/api/v1/user/profile',
      '/api/v3/analytics/track',
      '/api/v1/sync/media',
      '/api/v2/config/remote',
    ];
    const methods: any[] = ['GET', 'POST', 'PUT'];
    const newLog: ApiLog = {
      id: Math.random().toString(36).substr(2, 9),
      method: methods[Math.floor(Math.random() * methods.length)],
      url: endpoints[Math.floor(Math.random() * endpoints.length)],
      status: autoIntercept ? 'intercepted' : 'completed',
      timestamp: new Date().toLocaleTimeString(),
      delay: globalDelay,
      payload: { user_id: '8812', device: 'SM-G998B', token: 'eyJh...' },
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleAction = (id: string, action: 'drop' | 'release') => {
    setLogs(prev => prev.map(log => {
      if (log.id === id) {
        return { ...log, status: action === 'release' ? 'completed' : 'dropped' };
      }
      return log;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#00E676';
      case 'intercepted': return '#FFD600';
      case 'dropped': return '#FF1744';
      default: return '#7C4DFF';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#070A1A' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>API Interceptor</Text>
        <TouchableOpacity onPress={() => setLogs([])}>
          <Text style={{ color: AuraTheme.dark.secondary, fontWeight: '700' }}>Clear</Text>
        </TouchableOpacity>
      </View>

      <GlassCard style={styles.configCard}>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Auto Intercept Traffic</Text>
          <Switch 
            value={autoIntercept} 
            onValueChange={setAutoIntercept}
            trackColor={{ false: '#2C2F45', true: '#7C4DFF' }}
            thumbColor={'#fff'}
          />
        </View>
        <View style={[styles.configRow, { marginTop: 15 }]}>
          <Text style={styles.configLabel}>Global Delay Injection</Text>
          <View style={styles.delayControls}>
            <TouchableOpacity onPress={() => setGlobalDelay(d => Math.max(0, d - 1))} style={styles.delayBtn}>
              <Ionicons name="remove" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.delayVal}>{globalDelay}s</Text>
            <TouchableOpacity onPress={() => setGlobalDelay(d => d + 1)} style={styles.delayBtn}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>

      <ScrollView 
        ref={scrollRef}
        style={styles.logContainer}
        contentContainerStyle={{ paddingBottom: 50 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {logs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pulse" size={40} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>Waiting for Sandbox traffic...</Text>
          </View>
        ) : (
          logs.map((log) => (
            <GlassCard key={log.id} style={styles.logCard}>
              <View style={styles.logTop}>
                <View style={[styles.methodBadge, { backgroundColor: log.method === 'GET' ? '#00E5FF20' : '#7C4DFF20' }]}>
                  <Text style={[styles.methodText, { color: log.method === 'GET' ? '#00E5FF' : '#7C4DFF' }]}>{log.method}</Text>
                </View>
                <Text style={styles.logUrl} numberOfLines={1}>{log.url}</Text>
                <Text style={styles.logTime}>{log.timestamp}</Text>
              </View>

              {log.status === 'intercepted' ? (
                <View style={styles.interceptorPanel}>
                  <Text style={styles.interceptorWarning}>⚠️ REQUEST HELD BY PROXY</Text>
                  <View style={styles.payloadBox}>
                    <Text style={styles.payloadText}>{JSON.stringify(log.payload, null, 2)}</Text>
                    <TouchableOpacity style={styles.editBtn}>
                      <Ionicons name="create-outline" size={14} color={AuraTheme.dark.secondary} />
                      <Text style={styles.editBtnText}>Edit Payload</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: '#FF1744' }]} onPress={() => handleAction(log.id, 'drop')}>
                      <Text style={{ color: '#FF1744', fontWeight: '700' }}>Drop</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#7C4DFF', borderColor: '#7C4DFF' }]} onPress={() => handleAction(log.id, 'release')}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Release (Success)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.logBottom}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(log.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(log.status) }]}>
                    {log.status.toUpperCase()} {log.status === 'completed' ? `(${log.delay}s latency)` : ''}
                  </Text>
                </View>
              )}
            </GlassCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  configCard: { margin: 20, padding: 20 },
  configRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  configLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  delayControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BorderRadius.md, padding: 4 },
  delayBtn: { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  delayVal: { color: '#fff', fontSize: 16, fontWeight: '800', marginHorizontal: 12 },
  logContainer: { flex: 1, paddingHorizontal: 20 },
  logCard: { marginBottom: 15, padding: 15 },
  logTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  methodBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  methodText: { fontSize: 10, fontWeight: '800' },
  logUrl: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  logTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  logBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },
  interceptorPanel: { marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  interceptorWarning: { color: '#FFD600', fontSize: 10, fontWeight: '900', marginBottom: 8 },
  payloadBox: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8, marginBottom: 12 },
  payloadText: { color: '#00E5FF', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-end' },
  editBtnText: { color: AuraTheme.dark.secondary, fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  empty: { flex: 1, paddingVertical: 100, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: '600', marginTop: 15 },
});
