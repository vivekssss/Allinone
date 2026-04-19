import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image,
  Dimensions, ActivityIndicator, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import GlassCard from '@/components/GlassCard';
import { musicHubAPI, downloadsAPI } from '@/services/api';
import { AuraTheme } from '@/constants/aura-theme';
import { Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function ArtistDetail() {
  const router = useRouter();
  const { name, id } = useLocalSearchParams();
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchArtistSongs();
    checkFollowStatus();
  }, [name]);

  const fetchArtistSongs = async () => {
    setLoading(true);
    try {
      const res = await musicHubAPI.search(name as string, 'song');
      setSongs(res.data.results || []);
    } catch {
      Alert.alert('Error', 'Failed to fetch discography');
    }
    setLoading(false);
  };

  const checkFollowStatus = async () => {
    try {
      const res = await musicHubAPI.getArtists();
      const followed = res.data.followed || [];
      setIsFollowing(followed.some((a: any) => a.name === name));
    } catch { }
  };

  const toggleFollow = async () => {
    try {
      await musicHubAPI.followArtist({
        name: name as string,
        action: isFollowing ? 'unfollow' : 'follow'
      });
      setIsFollowing(!isFollowing);
    } catch {
      Alert.alert('Error', 'Could not update preferences');
    }
  };

  const handleDownloadAndPlay = async (song: any) => {
    try {
      Alert.alert('Syncing', `Adding "${song.title}" to your offline library...`);
      await downloadsAPI.queueDownload({
        url: `https://www.youtube.com/watch?v=${song.youtubeId}`,
        title: song.title,
        fileType: 'audio'
      });
      // In a real app, we'd wait for download then play. 
      // For now, we simulate the 'play' action.
      router.push({ pathname: '/(tabs)/media' as any });
    } catch {
      Alert.alert('Error', 'Failed to queue download');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#070A1A' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header/Banner */}
        <LinearGradient colors={['#7C4DFF', '#070A1A']} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.artistInfo}>
            <Text style={styles.artistName}>{name}</Text>
            <TouchableOpacity 
              style={[styles.followBtn, { backgroundColor: isFollowing ? 'rgba(255,255,255,0.1)' : '#fff' }]} 
              onPress={toggleFollow}
            >
              <Text style={[styles.followBtnText, { color: isFollowing ? '#fff' : '#000' }]}>
                {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Discography</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#7C4DFF" style={{ marginTop: 40 }} />
          ) : (
            songs.map((song, i) => (
              <TouchableOpacity key={i} onPress={() => handleDownloadAndPlay(song)}>
                <GlassCard style={styles.songCard}>
                  <Image source={{ uri: song.thumbnail }} style={styles.songThumb} />
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                    <Text style={styles.songMeta}>{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</Text>
                  </View>
                  <TouchableOpacity style={styles.playBtn} onPress={() => handleDownloadAndPlay(song)}>
                    <Ionicons name="play" size={20} color="#fff" />
                  </TouchableOpacity>
                </GlassCard>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 60, left: 20 },
  artistInfo: { alignItems: 'center', marginTop: 40 },
  artistName: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center' },
  followBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 25 },
  followBtnText: { fontSize: 13, fontWeight: '800' },
  content: { padding: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20, opacity: 0.8 },
  songCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 15 },
  songThumb: { width: 50, height: 50, borderRadius: 8 },
  songTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  songMeta: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 },
  playBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#7C4DFF', alignItems: 'center', justifyContent: 'center' },
});
