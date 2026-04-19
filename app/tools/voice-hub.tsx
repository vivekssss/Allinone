import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated,
  Dimensions, ActivityIndicator, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import GlassCard from '@/components/GlassCard';
import { AuraTheme } from '@/constants/aura-theme';
import { Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

const VOICE_EFFECTS = [
  { id: 'normal', name: 'Original', icon: 'mic', color: '#7C4DFF' },
  { id: 'robot', name: 'Robotica', icon: 'hardware-chip', color: '#00D2FF' },
  { id: 'chipmunk', name: 'Squirrel', icon: 'sunny', color: '#FFD600' },
  { id: 'deep', name: 'Subwoofer', icon: 'volume-low', color: '#FF3D71' },
  { id: 'echo', name: 'Cave Echo', icon: 'infinite', color: '#00E676' },
  { id: 'alien', name: 'Xenon', icon: 'planet', color: '#FF00FF' },
];

export default function VoiceHub() {
  const router = useRouter();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState(VOICE_EFFECTS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [metering, setMetering] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission Denied', 'Mic access is required.');

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      setRecordedUri(null);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordedUri(uri);
    setRecording(null);
  };

  const playEffect = async () => {
    if (!recordedUri) return;
    if (sound) {
      await sound.unloadAsync();
    }

    // Effect logic is simulated via playback speed and pitch where possible in expo-av
    let rate = 1.0;
    let pitch = 1.0;
    if (selectedEffect.id === 'chipmunk') { rate = 1.5; pitch = 1.5; }
    if (selectedEffect.id === 'deep') { rate = 0.8; pitch = 0.8; }
    if (selectedEffect.id === 'robot') { rate = 1.0; pitch = 0.9; }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: recordedUri },
      { shouldPlay: true, rate, pitchCorrectionQuality: Audio.PitchCorrectionQuality.High }
    );
    setSound(newSound);
    setIsPlaying(true);
    newSound.setOnPlaybackStatusUpdate((s) => {
      if (s.isLoaded && s.didJustFinish) setIsPlaying(false);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#070A1A' }]}>
      <LinearGradient colors={['#2A1B5E', '#070A1A']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Voice Hub</Text>
          <Ionicons name="mic-outline" size={24} color="#fff" />
        </View>

        <View style={styles.micStage}>
          <Animated.View style={[styles.micOuter, { transform: [{ scale: pulseAnim }], borderColor: isRecording ? '#FF3D71' : 'rgba(255,255,255,0.1)' }]}>
            <TouchableOpacity 
              onPress={isRecording ? stopRecording : startRecording}
              style={[styles.micInner, { backgroundColor: isRecording ? '#FF3D71' : '#7C4DFF' }]}
            >
              <Ionicons name={isRecording ? 'stop' : 'mic'} size={40} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
          <Text style={[styles.micStatus, { color: isRecording ? '#FF3D71' : 'rgba(255,255,255,0.4)' }]}>
            {isRecording ? 'RECORDING LIVE' : recordedUri ? 'RECORDING READY' : 'TAP TO START'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {recordedUri && (
          <GlassCard style={styles.previewCard}>
            <View style={styles.previewRow}>
              <TouchableOpacity onPress={playEffect} style={styles.playBtn}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewTitle}>Last Fragment</Text>
                <Text style={styles.previewSub}>Effect: {selectedEffect.name}</Text>
              </View>
              <TouchableOpacity style={styles.saveBtn}>
                 <Ionicons name="download-outline" size={20} color={AuraTheme.dark.secondary} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        <Text style={styles.sectionTitle}>Changer Presets</Text>
        <View style={styles.effectsGrid}>
          {VOICE_EFFECTS.map((effect) => (
            <TouchableOpacity 
              key={effect.id} 
              style={[styles.effectCard, selectedEffect.id === effect.id && { borderColor: effect.color, borderWidth: 2 }]}
              onPress={() => setSelectedEffect(effect)}
            >
              <GlassCard style={styles.effectCardInner}>
                <View style={[styles.effectIcon, { backgroundColor: effect.color + '20' }]}>
                  <Ionicons name={effect.icon as any} size={24} color={effect.color} />
                </View>
                <Text style={styles.effectName}>{effect.name}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  micStage: { alignItems: 'center', marginTop: 30 },
  micOuter: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  micInner: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', ...Shadows.glow },
  micStatus: { fontSize: 12, fontWeight: '800', marginTop: 20, letterSpacing: 1 },
  content: { padding: 20 },
  previewCard: { padding: 15, marginBottom: 30 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  playBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: AuraTheme.dark.primary, alignItems: 'center', justifyContent: 'center' },
  previewTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  previewSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  saveBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 15, opacity: 0.8 },
  effectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  effectCard: { width: (width - 40 - 24) / 3, borderRadius: 16 },
  effectCardInner: { alignItems: 'center', paddingVertical: 20 },
  effectIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  effectName: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
