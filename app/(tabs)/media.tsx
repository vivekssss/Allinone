import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import GlassCard from '@/components/GlassCard';
import NowPlayingBar from '@/components/NowPlayingBar';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

type MediaTab = 'music' | 'videos' | 'favorites';

interface MediaFile {
  id: string;
  filename: string;
  uri: string;
  duration: number;
  mediaType: string;
  createdAt: number;
}

export default function MediaScreen() {
  const [activeTab, setActiveTab] = useState<MediaTab>('music');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MediaFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    requestPermissions();
    return () => {
      // Cleanup sound on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (hasPermission) {
      loadMediaFiles();
    }
  }, [activeTab, hasPermission]);

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant media library access to browse your music and videos.'
      );
    }
  };

  const loadMediaFiles = async () => {
    try {
      const mediaType =
        activeTab === 'music'
          ? MediaLibrary.MediaType.audio
          : activeTab === 'videos'
          ? MediaLibrary.MediaType.video
          : [MediaLibrary.MediaType.audio, MediaLibrary.MediaType.video];

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: mediaType as any,
        first: 100,
        sortBy: [MediaLibrary.SortBy.modificationTime],
      });

      const files: MediaFile[] = media.assets.map((asset) => ({
        id: asset.id,
        filename: asset.filename,
        uri: asset.uri,
        duration: asset.duration,
        mediaType: asset.mediaType,
        createdAt: asset.creationTime,
      }));

      if (activeTab === 'favorites') {
        setMediaFiles(files.filter((f) => favorites.has(f.id)));
      } else {
        setMediaFiles(files);
      }
    } catch (e) {
      console.log('Error loading media:', e);
    }
  };

  const playMedia = async (file: MediaFile) => {
    try {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: file.uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPlaybackProgress(
              status.durationMillis
                ? status.positionMillis / status.durationMillis
                : 0
            );
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackProgress(0);
            }
          }
        }
      );

      soundRef.current = sound;
      setCurrentTrack(file);
      setIsPlaying(true);
    } catch (e) {
      console.log('Playback error:', e);
      Alert.alert('Playback Error', 'Could not play this file.');
    }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (!currentTrack) return;
    const currentIdx = mediaFiles.findIndex((f) => f.id === currentTrack.id);
    const nextIdx = (currentIdx + 1) % mediaFiles.length;
    playMedia(mediaFiles[nextIdx]);
  };

  const playPrevious = () => {
    if (!currentTrack) return;
    const currentIdx = mediaFiles.findIndex((f) => f.id === currentTrack.id);
    const prevIdx = currentIdx === 0 ? mediaFiles.length - 1 : currentIdx - 1;
    playMedia(mediaFiles[prevIdx]);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs: { key: MediaTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'music', label: 'Music', icon: 'musical-notes' },
    { key: 'videos', label: 'Videos', icon: 'videocam' },
    { key: 'favorites', label: 'Favorites', icon: 'heart' },
  ];

  const renderMediaItem = ({ item }: { item: MediaFile }) => (
    <TouchableOpacity
      style={[
        styles.mediaItem,
        currentTrack?.id === item.id && styles.mediaItemActive,
      ]}
      onPress={() => playMedia(item)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.mediaThumb,
          {
            backgroundColor:
              item.mediaType === 'audio' ? Colors.primary + '20' : Colors.secondary + '20',
          },
        ]}
      >
        <Ionicons
          name={item.mediaType === 'audio' ? 'musical-note' : 'play'}
          size={24}
          color={item.mediaType === 'audio' ? Colors.primary : Colors.secondary}
        />
      </View>
      <View style={styles.mediaInfo}>
        <Text style={styles.mediaTitle} numberOfLines={1}>
          {item.filename.replace(/\.[^/.]+$/, '')}
        </Text>
        <Text style={styles.mediaDuration}>
          {item.duration > 0 ? formatDuration(item.duration) : 'Unknown'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => toggleFavorite(item.id)}
        style={styles.favBtn}
      >
        <Ionicons
          name={favorites.has(item.id) ? 'heart' : 'heart-outline'}
          size={20}
          color={favorites.has(item.id) ? Colors.accent : Colors.textMuted}
        />
      </TouchableOpacity>
      {currentTrack?.id === item.id && isPlaying && (
        <View style={styles.playingIndicator}>
          <View style={[styles.bar, styles.bar1]} />
          <View style={[styles.bar, styles.bar2]} />
          <View style={[styles.bar, styles.bar3]} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary + '25', Colors.background]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Media Player</Text>
        <Text style={styles.headerSubtitle}>
          {mediaFiles.length} files found
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? Colors.primary : Colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Media List */}
      {!hasPermission ? (
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Permission Required</Text>
          <Text style={styles.emptyText}>
            Grant media library access to browse your files
          </Text>
        </View>
      ) : mediaFiles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Files Found</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'favorites'
              ? 'Mark songs as favorites to see them here'
              : `No ${activeTab} files found on your device`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={mediaFiles}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Now Playing Bar */}
      {currentTrack && (
        <NowPlayingBar
          title={currentTrack.filename.replace(/\.[^/.]+$/, '')}
          artist="Local File"
          isPlaying={isPlaying}
          onPlayPause={togglePlayPause}
          onNext={playNext}
          onPrevious={playPrevious}
          progress={playbackProgress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.title,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  tabActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary + '40',
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  mediaItemActive: {
    borderColor: Colors.primary + '50',
    backgroundColor: Colors.primary + '10',
  },
  mediaThumb: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaInfo: {
    flex: 1,
  },
  mediaTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  mediaDuration: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  favBtn: {
    padding: Spacing.xs,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
  },
  bar: {
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 1.5,
  },
  bar1: { height: 8 },
  bar2: { height: 14 },
  bar3: { height: 10 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
  },
});
