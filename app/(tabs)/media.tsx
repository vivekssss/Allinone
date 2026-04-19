import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Image,
  Platform, Dimensions, Alert, TextInput, ActivityIndicator, Modal, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio, Video, ResizeMode } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from 'react-i18next';
import { downloadsAPI, musicHubAPI } from '@/services/api';
import GlassCard from '@/components/GlassCard';
import { Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import { useMusic } from '@/context/MusicContext';
import '@/i18n';

const { width } = Dimensions.get('window');

type MediaTab = 'music' | 'videos' | 'favorites' | 'artists' | 'browse' | 'downloads';

interface MediaFile {
  id: string;
  filename: string;
  uri: string;
  duration: number;
  mediaType: string;
  createdAt: number;
}

export default function MediaScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { currentTrack, isPlaying, playTrack, togglePlay } = useMusic();
  const [activeTab, setActiveTab] = useState<MediaTab>('music');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<MediaFile | null>(null);
  
  // Music Hub State
  const [featuredArtists, setFeaturedArtists] = useState<any[]>([]);
  const [followedArtists, setFollowedArtists] = useState<any[]>([]);
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [artistSearchResults, setArtistSearchResults] = useState<any[]>([]);
  const [searchingArtists, setSearchingArtists] = useState(false);
  const [loadingArtists, setLoadingArtists] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    requestPermissions();
    loadDownloadHistory();
    loadArtists();
  }, []);

  useEffect(() => {
    if (activeTab === 'artists') {
      const { musicHubAPI: mApi } = require('@/services/api');
      mApi.triggerAutoDownload().catch(() => {});
    }
  }, [activeTab]);

  const requestPermissions = async () => {
    try {
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
        loadMedia('music');
      } else if (!canAskAgain) {
        Alert.alert(
          'Permission Required',
          'Media permission is required to view your device files. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch { }
  };

  const loadMedia = async (tab: string) => {
    setLoadingFiles(true);
    try {
      const mediaType = tab === 'videos' ? MediaLibrary.MediaType.video : MediaLibrary.MediaType.audio;
      const result = await MediaLibrary.getAssetsAsync({
        mediaType,
        first: 100,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      setMediaFiles(result.assets.map(a => ({
        id: a.id,
        filename: a.filename,
        uri: a.uri,
        duration: a.duration,
        mediaType: a.mediaType,
        createdAt: a.creationTime,
      })));
    } catch { setMediaFiles([]); }
    setLoadingFiles(false);
  };

  useEffect(() => {
    if (hasPermission && (activeTab === 'music' || activeTab === 'videos')) {
      loadMedia(activeTab);
    }
  }, [activeTab, hasPermission]);

  const loadDownloadHistory = async () => {
    try {
      const res = await downloadsAPI.getHistory(50);
      setDownloadHistory(res.data.tasks || []);
    } catch { }
  };

  const loadArtists = async () => {
    setLoadingArtists(true);
    try {
      const { musicHubAPI: mApi } = require('@/services/api');
      const res = await mApi.getArtists();
      setFeaturedArtists(res.data.featured || []);
      setFollowedArtists(res.data.followed || []);
    } catch { }
    setLoadingArtists(false);
  };

  const searchArtists = async () => {
    if (!artistSearchQuery.trim()) return;
    setSearchingArtists(true);
    try {
      const { musicHubAPI: mApi } = require('@/services/api');
      const res = await mApi.search(artistSearchQuery, 'artist');
      setArtistSearchResults(res.data.results || []);
    } catch { }
    setSearchingArtists(false);
  };

  const toggleFollow = async (artist: any) => {
    try {
      const { musicHubAPI: mApi } = require('@/services/api');
      const isFollowing = followedArtists.some(a => a.name === (artist.name || artist.title));
      await mApi.followArtist({
        name: artist.name || artist.title,
        youtubeId: artist.youtubeId || artist.id,
        thumbnail: artist.thumbnail,
        action: isFollowing ? 'unfollow' : 'follow'
      });
      loadArtists();
    } catch {
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handlePlayTrack = async (track: MediaFile) => {
    if (track.mediaType === 'video') {
      setCurrentVideo(track);
      return;
    }
    await playTrack(track);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'video/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const file = result.assets[0];
        playTrack({
          id: file.uri,
          filename: file.name,
          uri: file.uri,
          duration: 0,
          mediaType: file.mimeType?.includes('video') ? 'video' : 'audio',
          createdAt: Date.now(),
        });
      }
    } catch { }
  };

  const handleDownload = async () => {
    if (!downloadUrl.trim()) return;
    setDownloading(true);
    try {
      const url = downloadUrl.trim();
      const filename = url.split('/').pop()?.split('?')[0] || `download_${Date.now()}.mp4`;
      const fileUri = `${(FileSystem as any).documentDirectory}${filename}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          // Could update progress here visually if needed
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        await downloadsAPI.queueDownload({ url, title: filename, fileType: filename.endsWith('.mp3') ? 'audio' : 'video' });
        Alert.alert('✅ Download Complete', `Saved to ${result.uri}`);
        setDownloadUrl('');
        loadDownloadHistory();
      }
    } catch {
      Alert.alert('Error', 'Could not download file. Please check the URL.');
    }
    setDownloading(false);
  };

  const deleteDownload = async (id: string) => {
    try {
      await downloadsAPI.deleteDownload(id);
      setDownloadHistory(prev => prev.filter(d => d._id !== id));
    } catch { }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getFilteredFiles = () => {
    if (activeTab === 'favorites') return mediaFiles.filter(f => favorites.has(f.id));
    return mediaFiles;
  };

  const tabs: { key: MediaTab; label: string; icon: string }[] = [
    { key: 'music', label: t('media.music'), icon: 'musical-notes' },
    { key: 'artists', label: 'Artists', icon: 'people' },
    { key: 'videos', label: t('media.videos'), icon: 'videocam' },
    { key: 'favorites', label: t('media.favorites'), icon: 'heart' },
    { key: 'browse', label: t('media.browse'), icon: 'folder-open' },
    { key: 'downloads', label: t('media.downloads'), icon: 'cloud-download' },
  ];

  const ds = createStyles(colors);

  return (
    <View style={ds.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={[colors.primary + '30', 'transparent']} style={ds.header}>
          <Text style={ds.title}>🎵 {t('media.title')}</Text>
          <Text style={ds.subtitle}>{t('media.filesFound', { count: mediaFiles.length })}</Text>
        </LinearGradient>

        {/* Tab Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ds.tabScroll} contentContainerStyle={ds.tabContainer}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[ds.tab, activeTab === tab.key && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? colors.primary : colors.textMuted} />
              <Text style={[ds.tabText, activeTab === tab.key && { color: colors.primary }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Permission needed */}
        {!hasPermission && activeTab !== 'downloads' ? (
          <View style={ds.section}>
            <GlassCard style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="lock-closed" size={48} color={colors.textMuted} />
              <Text style={[ds.emptyTitle, { color: colors.textPrimary }]}>{t('media.permissionRequired')}</Text>
              <Text style={[ds.emptyText, { color: colors.textMuted }]}>{t('media.grantAccess')}</Text>
              <TouchableOpacity onPress={requestPermissions}>
                <LinearGradient colors={[colors.primary, colors.secondary]} style={ds.grantBtn}>
                  <Text style={ds.grantBtnText}>Grant Access</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          </View>
        ) : activeTab === 'browse' ? (
          /* Browse Tab */
          <View style={ds.section}>
            <GlassCard style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Ionicons name="folder-open" size={48} color={colors.primary} />
              <Text style={[ds.emptyTitle, { color: colors.textPrimary }]}>Browse Files</Text>
              <Text style={[ds.emptyText, { color: colors.textMuted }]}>Pick audio or video files from your device</Text>
              <TouchableOpacity onPress={pickFile} style={{ marginTop: 16 }}>
                <LinearGradient colors={[colors.primary, colors.secondary]} style={ds.grantBtn}>
                  <Ionicons name="document" size={18} color="#fff" />
                  <Text style={ds.grantBtnText}>{t('media.pickFromDevice')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>

            {/* Quick folders */}
            <Text style={[ds.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.lg }]}>📁 Quick Folders</Text>
            {['Music', 'Downloads', 'DCIM', 'Recordings', 'Podcasts'].map((folder, i) => (
              <TouchableOpacity key={i} onPress={pickFile}>
                <GlassCard style={ds.folderItem}>
                  <Ionicons name="folder" size={24} color={colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={[ds.folderName, { color: colors.textPrimary }]}>{folder}</Text>
                    <Text style={[ds.folderPath, { color: colors.textMuted }]}>/storage/emulated/0/{folder}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        ) : activeTab === 'downloads' ? (
          /* Downloads Tab */
          <View style={ds.section}>
            {/* Download input */}
            <GlassCard>
              <Text style={[ds.sectionTitle, { color: colors.textPrimary }]}>⬇️ {t('media.downloads')}</Text>
              <View style={ds.downloadInputRow}>
                <TextInput
                  style={[ds.downloadInput, { color: colors.textPrimary, borderColor: colors.glassBorder, backgroundColor: colors.card }]}
                  placeholder={t('media.pasteUrl')}
                  placeholderTextColor={colors.textMuted}
                  value={downloadUrl}
                  onChangeText={setDownloadUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[ds.downloadBtn, { opacity: downloadUrl.trim() ? 1 : 0.5 }]}
                  onPress={handleDownload}
                  disabled={!downloadUrl.trim() || downloading}
                >
                  <LinearGradient colors={[colors.primary, colors.secondary]} style={ds.downloadBtnGradient}>
                    {downloading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="download" size={18} color="#fff" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Download History */}
            <Text style={[ds.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.lg }]}>📋 History</Text>
            {downloadHistory.length === 0 ? (
              <GlassCard style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Ionicons name="cloud-download-outline" size={40} color={colors.textMuted} />
                <Text style={[ds.emptyText, { color: colors.textMuted }]}>No downloads yet</Text>
              </GlassCard>
            ) : (
              downloadHistory.map((dl, i) => (
                <GlassCard key={i} style={ds.downloadItem}>
                  <View style={ds.downloadRow}>
                    <Ionicons name={dl.fileType === 'audio' ? 'musical-note' : dl.fileType === 'video' ? 'videocam' : 'document'} size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[ds.downloadTitle, { color: colors.textPrimary }]} numberOfLines={1}>{dl.title}</Text>
                      <Text style={[ds.downloadMeta, { color: colors.textMuted }]}>
                        {dl.status} • {dl.fileType} {dl.fileSize ? `• ${(dl.fileSize / 1024 / 1024).toFixed(1)}MB` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteDownload(dl._id)}>
                      <Ionicons name="trash-outline" size={18} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                  {dl.status === 'downloading' && (
                    <View style={ds.progressBarBg}>
                      <View style={[ds.progressBarFill, { width: `${dl.progress || 0}%`, backgroundColor: colors.primary }]} />
                    </View>
                  )}
                </GlassCard>
              ))
            )}
          </View>
        ) : activeTab === 'artists' ? (
          /* Artists Tab */
          <View style={ds.section}>
            <GlassCard style={{ padding: 15, marginBottom: 20 }}>
              <Text style={[ds.sectionTitle, { color: colors.textPrimary }]}>🔍 Explore Artists</Text>
              <View style={ds.downloadInputRow}>
                <TextInput 
                  style={[ds.downloadInput, { color: colors.textPrimary, borderColor: colors.glassBorder, backgroundColor: colors.card }]}
                  placeholder="Search Arijit, Taylor Swift, etc..."
                  placeholderTextColor={colors.textMuted}
                  value={artistSearchQuery}
                  onChangeText={setArtistSearchQuery}
                  onSubmitEditing={searchArtists}
                />
                <TouchableOpacity style={ds.downloadBtn} onPress={searchArtists} disabled={searchingArtists}>
                  <LinearGradient colors={[colors.primary, colors.secondary]} style={ds.downloadBtnGradient}>
                    {searchingArtists ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="search" size={18} color="#fff" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {artistSearchResults.length > 0 && (
              <>
                <Text style={[ds.sectionTitle, { color: colors.textPrimary }]}>Search Results</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {artistSearchResults.map((artist, i) => (
                    <TouchableOpacity key={i} onPress={() => toggleFollow(artist)}>
                      <GlassCard style={ds.artistCard}>
                        <Image source={{ uri: artist.thumbnail || 'https://via.placeholder.com/100' }} style={ds.artistImg} />
                        <Text style={ds.artistName} numberOfLines={1}>{artist.title}</Text>
                        <View style={[ds.followTag, { backgroundColor: followedArtists.some(a => a.name === artist.title) ? colors.success + '20' : colors.primary + '20' }]}>
                          <Text style={{ color: followedArtists.some(a => a.name === artist.title) ? colors.success : colors.primary, fontSize: 10, fontWeight: '700' }}>
                            {followedArtists.some(a => a.name === artist.title) ? 'FOLLOWING' : '+ FOLLOW'}
                          </Text>
                        </View>
                      </GlassCard>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={[ds.sectionTitle, { color: colors.textPrimary }]}>⭐ Featured Artists</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {featuredArtists.map((artist, i) => (
                <TouchableOpacity key={i} onPress={() => toggleFollow(artist)}>
                  <GlassCard style={ds.artistCard}>
                    <Image source={{ uri: artist.thumbnail }} style={ds.artistImg} />
                    <Text style={ds.artistName} numberOfLines={1}>{artist.name}</Text>
                    <View style={[ds.followTag, { backgroundColor: followedArtists.some(a => a.name === artist.name) ? colors.success + '20' : colors.primary + '20' }]}>
                      <Text style={{ color: followedArtists.some(a => a.name === artist.name) ? colors.success : colors.primary, fontSize: 10, fontWeight: '700' }}>
                        {followedArtists.some(a => a.name === artist.name) ? 'FOLLOWING' : '+ FOLLOW'}
                      </Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[ds.sectionTitle, { color: colors.textPrimary }]}>❤️ Your Following</Text>
            {followedArtists.length === 0 ? (
              <GlassCard style={{ padding: 30, alignItems: 'center' }}>
                <Ionicons name="people-outline" size={40} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: 10 }}>Follow artists to sync daily songs</Text>
              </GlassCard>
            ) : (
              followedArtists.map((artist, i) => (
                <TouchableOpacity key={i} onPress={() => router.push({ pathname: '/media/artist-detail' as any, params: { name: artist.name, id: artist._id } })}>
                  <GlassCard style={ds.followedItem}>
                    <Image source={{ uri: artist.thumbnail || 'https://via.placeholder.com/100' }} style={ds.followedImg} />
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{artist.name}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Syncing daily tracks...</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          /* Music/Videos/Favorites Tab */
          <View style={ds.section}>
            {loadingFiles ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : getFilteredFiles().length === 0 ? (
              <GlassCard style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name={activeTab === 'favorites' ? 'heart-outline' : 'musical-notes-outline'} size={48} color={colors.textMuted} />
                <Text style={[ds.emptyTitle, { color: colors.textPrimary }]}>{t('media.noFiles')}</Text>
                <Text style={[ds.emptyText, { color: colors.textMuted }]}>
                  {activeTab === 'favorites' ? t('media.markFavorites') : t('media.noMediaFiles', { type: activeTab })}
                </Text>
              </GlassCard>
            ) : (
              getFilteredFiles().map((file, i) => (
                <TouchableOpacity key={file.id} onPress={() => playTrack(file)}>
                  <GlassCard style={[ds.trackItem, currentTrack?.id === file.id && { borderColor: colors.primary, borderWidth: 1 }]}>
                    <View style={ds.trackRow}>
                      <View style={[ds.trackIcon, { backgroundColor: currentTrack?.id === file.id ? colors.primary + '30' : colors.card }]}>
                        <Ionicons
                          name={currentTrack?.id === file.id && isPlaying ? 'pause' : activeTab === 'videos' ? 'videocam' : 'musical-note'}
                          size={18}
                          color={currentTrack?.id === file.id ? colors.primary : colors.textMuted}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[ds.trackName, { color: currentTrack?.id === file.id ? colors.primary : colors.textPrimary }]} numberOfLines={1}>
                          {file.filename.replace(/\.[^.]+$/, '')}
                        </Text>
                        <Text style={[ds.trackDuration, { color: colors.textMuted }]}>{formatDuration(file.duration)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity 
                          onPress={() => router.push({ pathname: '/media/editor' as any, params: { uri: file.uri, id: file.id } })}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="create-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleFavorite(file.id)} style={{ padding: 4 }}>
                          <Ionicons name={favorites.has(file.id) ? 'heart' : 'heart-outline'} size={20} color={favorites.has(file.id) ? colors.accent : colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={{ height: currentTrack ? 160 : 100 }} />
      </ScrollView>

      {/* Video Player Modal */}
      <Modal visible={!!currentVideo} animationType="slide" onRequestClose={() => setCurrentVideo(null)} presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 50 : 20 }}>
            <Text style={{ color: '#fff', fontSize: FontSize.lg, fontWeight: '700', flex: 1 }} numberOfLines={1}>{currentVideo?.filename}</Text>
            <TouchableOpacity onPress={() => setCurrentVideo(null)}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
          {currentVideo && (
            <Video
              source={{ uri: currentVideo.uri }}
              style={{ flex: 1, width: '100%', height: '100%' }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
          )}
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity style={[ds.fab, { backgroundColor: colors.primary }]} onPress={pickFile}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingBottom: Spacing.md },
  title: { color: colors.textPrimary, fontSize: FontSize.title, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: FontSize.md, marginTop: 4 },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  tabScroll: { marginTop: Spacing.sm },
  tabContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: colors.glassBorder },
  tabText: { color: colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', marginTop: 12 },
  emptyText: { fontSize: FontSize.sm, marginTop: 4, textAlign: 'center' },
  grantBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.lg, marginTop: 16 },
  grantBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  // Track
  trackItem: { marginBottom: Spacing.sm },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  trackIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trackName: { fontSize: FontSize.md, fontWeight: '600' },
  trackDuration: { fontSize: FontSize.xs, marginTop: 2 },
  // Folder
  folderItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  folderName: { fontSize: FontSize.md, fontWeight: '600' },
  folderPath: { fontSize: FontSize.xs, marginTop: 2 },
  // Download
  downloadInputRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  downloadInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1, fontSize: FontSize.sm },
  downloadBtn: { justifyContent: 'center' },
  downloadBtnGradient: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  downloadItem: { marginBottom: Spacing.sm },
  downloadRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  downloadTitle: { fontSize: FontSize.md, fontWeight: '600' },
  downloadMeta: { fontSize: FontSize.xs, marginTop: 2 },
  progressBarBg: { height: 3, backgroundColor: colors.glassBorder, borderRadius: 2, marginTop: Spacing.sm },
  progressBarFill: { height: 3, borderRadius: 2 },
  // Now playing
  nowPlayingBar: { position: 'absolute', bottom: Platform.OS === 'ios' ? 90 : 68, left: 0, right: 0, ...Shadows.card },
  npProgressBar: { height: 2, backgroundColor: colors.glassBorder },
  npProgressFill: { height: 2 },
  npContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  npIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  npTitle: { fontSize: FontSize.md, fontWeight: '600' },
  npPlayBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  // FAB
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 150 : 130, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', ...Shadows.glow },
  // Artists
  artistCard: { width: 120, alignItems: 'center', marginRight: 15, padding: 12 },
  artistImg: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  artistName: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  followTag: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  followedItem: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 12 },
  followedImg: { width: 50, height: 50, borderRadius: 25 },
});
