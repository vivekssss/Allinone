import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { AuraTheme } from '@/constants/aura-theme';
import { Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Props {
  currentTrack: any;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export default function MusicMiniPlayer({ currentTrack, isPlaying, onTogglePlay }: Props) {
  const router = useRouter();

  if (!currentTrack) return null;

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      style={styles.container}
      onPress={() => router.push({
        pathname: '/media/player-screen' as any,
        params: { ...currentTrack }
      })}
    >
      <BlurView intensity={80} tint="dark" style={styles.blur}>
        <View style={styles.content}>
          <Image 
            source={{ uri: currentTrack.thumbnail || 'https://via.placeholder.com/50' }} 
            style={styles.thumb} 
          />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist || 'YouTube Music'}</Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity onPress={onTogglePlay} style={styles.playBtn}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="play-skip-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '35%' }]} />
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    left: 10,
    right: 10,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  blur: { flex: 1 },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  thumb: { width: 44, height: 44, borderRadius: 8 },
  info: { flex: 1, marginLeft: 12, marginRight: 10 },
  title: { color: '#fff', fontSize: 14, fontWeight: '700' },
  artist: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  playBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  progressBar: { height: 2, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%' },
  progressFill: { height: 2, backgroundColor: '#7C4DFF' },
});
