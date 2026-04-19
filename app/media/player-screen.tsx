import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Dimensions,
  Platform, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import GlassCard from '@/components/GlassCard';
import { AuraTheme } from '@/constants/aura-theme';
import { Shadows, Spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function MusicPlayerScreen() {
  const router = useRouter();
  const { id, title, artist, thumbnail, uri } = useLocalSearchParams();
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0.35); // Simulated progress
  const [isFavorite, setIsFavorite] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [isShuffle, setIsShuffle] = useState(false);

  const formatTime = (p: number) => {
    const total = 245; // Simulated 4:05 total
    const current = Math.floor(total * p);
    const m = Math.floor(current / 60);
    const s = current % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Background Album Art Blur */}
      <Image 
        source={{ uri: (thumbnail as string) || 'https://via.placeholder.com/500' }} 
        style={StyleSheet.absoluteFill} 
        blurRadius={Platform.OS === 'ios' ? 80 : 30}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerSubtitle}>NOW PLAYING FROM HUB</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.albumArea}>
        <GlassCard style={styles.albumCard}>
          <Image 
            source={{ uri: (thumbnail as string) || 'https://via.placeholder.com/500' }} 
            style={styles.albumArt} 
          />
        </GlassCard>
      </View>

      <View style={styles.infoArea}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.songTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.artistName}>{artist || 'Unknown Artist'}</Text>
          </View>
          <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={28} color={isFavorite ? "#FF3D71" : "#fff"} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]}>
              <View style={styles.progressKnob} />
            </View>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(progress)}</Text>
            <Text style={styles.timeText}>4:05</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={() => setIsShuffle(!isShuffle)}>
            <Ionicons name="shuffle" size={24} color={isShuffle ? "#00E5FF" : "rgba(255,255,255,0.4)"} />
          </TouchableOpacity>
          
          <TouchableOpacity>
            <Ionicons name="play-skip-back" size={36} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playBtn} onPress={() => setIsPlaying(!isPlaying)}>
            <LinearGradient colors={['#7C4DFF', '#00D2FF']} style={styles.playBtnGradient}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity>
            <Ionicons name="play-skip-forward" size={36} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRepeatMode(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none')}>
            <Ionicons 
              name={repeatMode === 'one' ? "repeat" : "repeat"} 
              size={24} 
              color={repeatMode !== 'none' ? "#7C4DFF" : "rgba(255,255,255,0.4)"} 
            />
            {repeatMode === 'one' && <Text style={styles.repeatBadge}>1</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={async () => {
            try {
              if (Platform.OS === 'android') {
                 // Android: Tell user how to find it after saving to internal storage
                 Alert.alert(
                   "Ringtone Setup", 
                   "To set this track as your ringtone:\n\n1. Save the file in the next step.\n2. Open device Settings > Sounds.\n3. Add new ringtone and select the saved file."
                 );
              } else {
                 // iOS: Needs manual GarageBand/iTunes export
                 Alert.alert(
                   "iOS Ringtone", 
                   "iOS requires ringtones to be added via GarageBand or iTunes. We will export the audio file for you to save."
                 );
              }
              const FileSystem = require('expo-file-system');
              const Sharing = require('expo-sharing');
              // Simulate downloading the actual audio file to local cache if not already present
              // In a real app we would use the actual local URI if downloaded
              const dummyAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; 
              const titleStr = typeof title === 'string' ? title : (title?.[0] || 'ringtone');
              const fileUri = FileSystem.cacheDirectory + titleStr.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.mp3';
              
              Alert.alert('Preparing', 'Preparing ringtone file...');
              
              const { uri: localUri } = await FileSystem.downloadAsync(dummyAudioUrl, fileUri);
              
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(localUri, { 
                  mimeType: 'audio/mpeg',
                  dialogTitle: 'Save Ringtone'
                });
              } else {
                Alert.alert('Error', 'Sharing is not available on this device');
              }
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to export ringtone.');
            }
          }}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Ringtone</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="list" size={20} color="#fff" />
            <Text style={styles.actionText}>Queue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50 },
  headerSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  albumArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  albumCard: { padding: 0, borderRadius: 20, overflow: 'hidden', ...Shadows.glow },
  albumArt: { width: width - 100, height: width - 100 },
  infoArea: { paddingHorizontal: 30, paddingBottom: 50 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  songTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  artistName: { color: 'rgba(255,255,255,0.6)', fontSize: 16, marginTop: 4 },
  progressContainer: { marginBottom: 30 },
  progressBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#7C4DFF', borderRadius: 2, position: 'relative' },
  progressKnob: { position: 'absolute', right: -6, top: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff', ...Shadows.glow },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timeText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700' },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  playBtn: { width: 80, height: 80, borderRadius: 40, ...Shadows.glow },
  playBtnGradient: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  repeatBadge: { position: 'absolute', top: 12, right: 0, fontSize: 8, color: '#7C4DFF', fontWeight: '900' },
  footerActions: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
});
