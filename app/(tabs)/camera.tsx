import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Dimensions, Image,
  FlatList, Modal, ScrollView, Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from 'react-i18next';
import { photosAPI } from '@/services/api';
import GlassCard from '@/components/GlassCard';
import { Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import '@/i18n';

const { width, height } = Dimensions.get('window');

interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
  timestamp: Date;
}

export default function CameraScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState<'picture' | 'video'>('picture');
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [zoom, setZoom] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [showFlash, setShowFlash] = useState(false);

  // New features
  const [showGrid, setShowGrid] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerCountdown, setTimerCountdown] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [hdrEnabled, setHdrEnabled] = useState(false);
  const [mirrorSelfie, setMirrorSelfie] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'4:3' | '16:9' | '1:1'>('4:3');
  const [activeFilter, setActiveFilter] = useState('none');
  const [showFilters, setShowFilters] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  const filters = [
    { id: 'none', name: 'Normal', color: 'transparent' },
    { id: 'vivid', name: 'Vivid', color: 'rgba(255, 100, 50, 0.15)' },
    { id: 'cool', name: 'Cool', color: 'rgba(50, 100, 255, 0.15)' },
    { id: 'warm', name: 'Warm', color: 'rgba(255, 200, 50, 0.15)' },
    { id: 'noir', name: 'B&W', color: 'rgba(0, 0, 0, 0.4)' },
    { id: 'fade', name: 'Fade', color: 'rgba(200, 200, 200, 0.3)' },
  ];

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaPermission(status === 'granted');
    })();
  }, []);

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={[colors.primary + '30', 'transparent']} style={styles.permissionContainer}>
          <Ionicons name="camera" size={64} color={colors.primary} />
          <Text style={[styles.permTitle, { color: colors.textPrimary }]}>{t('camera.cameraAccess')}</Text>
          <Text style={[styles.permDesc, { color: colors.textSecondary }]}>{t('camera.allowAccess')}</Text>
          <TouchableOpacity onPress={requestPermission}>
            <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.permButton}>
              <Ionicons name="lock-open" size={20} color="#fff" />
              <Text style={styles.permButtonText}>{t('camera.grantPermission')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    if (timer > 0) {
      setIsTimerActive(true);
      setTimerCountdown(timer);
      for (let i = timer; i > 0; i--) {
        setTimerCountdown(i);
        await new Promise(r => setTimeout(r, 1000));
      }
      setIsTimerActive(false);
      setTimerCountdown(0);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Flash animation
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92 });
      if (photo) {
        const newPhoto: CapturedPhoto = {
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          timestamp: new Date(),
        };
        setCapturedPhotos(prev => [newPhoto, ...prev]);
        setPhotoCount(prev => prev + 1);

        if (mediaPermission) {
          try { await MediaLibrary.saveToLibraryAsync(photo.uri); } catch { }
        }
        try {
          await photosAPI.save({
            uri: photo.uri,
            width: photo.width,
            height: photo.height,
            filter: activeFilter,
            mode: 'photo',
          });
        } catch { }
      }
    } catch { }
  };

  const toggleRecording = async () => {
    if (!cameraRef.current) return;
    if (isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      try {
        const video = await cameraRef.current.recordAsync({});
        if (video && mediaPermission) {
          await MediaLibrary.saveToLibraryAsync(video.uri);
          Alert.alert(t('camera.videoSaved'));
        }
      } catch { }
      setIsRecording(false);
    }
  };

  const cycleTimer = () => {
    const timers = [0, 3, 5, 10];
    const idx = timers.indexOf(timer);
    setTimer(timers[(idx + 1) % timers.length]);
  };

  const cycleAspectRatio = () => {
    const ratios: ('4:3' | '16:9' | '1:1')[] = ['4:3', '16:9', '1:1'];
    const idx = ratios.indexOf(aspectRatio);
    setAspectRatio(ratios[(idx + 1) % ratios.length]);
  };

  const getAspectStyle = () => {
    if (aspectRatio === '1:1') return { height: width, width };
    if (aspectRatio === '16:9') return { height: width * 16 / 9, width };
    return { flex: 1 };
  };

  const deletePhoto = (photo: CapturedPhoto) => {
    Alert.alert(t('camera.deletePhoto'), t('camera.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: () => {
          setCapturedPhotos(prev => prev.filter(p => p.uri !== photo.uri));
          setSelectedPhoto(null);
          setPhotoCount(prev => prev - 1);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showGallery ? (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={[colors.primary + '30', 'transparent']} style={styles.galleryHeader}>
            <View style={styles.galleryTitleRow}>
              <TouchableOpacity onPress={() => setShowGallery(false)}>
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.galleryTitle, { color: colors.textPrimary }]}>{t('camera.myPhotos')}</Text>
              <Text style={[styles.photoCountBadge, { color: colors.primary }]}>{photoCount}</Text>
            </View>
          </LinearGradient>

          {capturedPhotos.length === 0 ? (
            <View style={styles.emptyGallery}>
              <Ionicons name="images-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('camera.noPhotos')}</Text>
              <TouchableOpacity onPress={() => setShowGallery(false)}>
                <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>{t('camera.openCamera')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.galleryGrid}>
              {capturedPhotos.map((photo, i) => (
                <TouchableOpacity key={i} onPress={() => setSelectedPhoto(photo)} style={styles.galleryItem}>
                  <Image source={{ uri: photo.uri }} style={styles.galleryImage} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Photo Preview Modal */}
          <Modal visible={!!selectedPhoto} transparent animationType="fade">
            <View style={styles.previewOverlay}>
              <TouchableOpacity style={styles.previewClose} onPress={() => setSelectedPhoto(null)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              {selectedPhoto && (
                <>
                  <Image source={{ uri: selectedPhoto.uri }} style={styles.previewImage} resizeMode="contain" />
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deletePhoto(selectedPhoto)}>
                    <Ionicons name="trash" size={22} color={colors.accent} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Modal>
        </ScrollView>
      ) : (
        <>
          {/* Camera View */}
          <View style={[styles.cameraContainer, getAspectStyle()]}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing={facing}
              flash={flash}
              zoom={zoom}
              mode={mode}
              mirror={facing === 'front' && mirrorSelfie}
            />

            {/* Filter overlay */}
            {activeFilter !== 'none' && (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: filters.find(f => f.id === activeFilter)?.color }]} />
            )}

            {/* Grid overlay */}
            {showGrid && (
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <View style={[styles.gridLine, styles.gridH1, { borderColor: 'rgba(255,255,255,0.3)' }]} />
                <View style={[styles.gridLine, styles.gridH2, { borderColor: 'rgba(255,255,255,0.3)' }]} />
                <View style={[styles.gridLine, styles.gridV1, { borderColor: 'rgba(255,255,255,0.3)' }]} />
                <View style={[styles.gridLine, styles.gridV2, { borderColor: 'rgba(255,255,255,0.3)' }]} />
              </View>
            )}

            {/* Timer countdown */}
            {isTimerActive && (
              <View style={styles.timerOverlay}>
                <Text style={styles.timerText}>{timerCountdown}</Text>
              </View>
            )}

            {/* Flash animation */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#fff', opacity: flashAnim }]} pointerEvents="none" />

            {/* Top controls */}
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.topBtn} onPress={() => setFlash(prev => prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off')}>
                <Ionicons name={flash === 'off' ? 'flash-off' : flash === 'auto' ? 'flash' : 'flash'} size={22} color="#fff" />
                {flash !== 'off' && <View style={[styles.topBtnBadge, { backgroundColor: colors.warning }]} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBtn} onPress={() => setShowGrid(!showGrid)}>
                <Ionicons name="grid" size={22} color={showGrid ? colors.warning : '#fff'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBtn} onPress={cycleTimer}>
                <Ionicons name="timer" size={22} color={timer > 0 ? colors.warning : '#fff'} />
                {timer > 0 && <Text style={styles.timerBadge}>{timer}s</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBtn} onPress={() => setHdrEnabled(!hdrEnabled)}>
                <Text style={[styles.hdrText, hdrEnabled && { color: colors.warning }]}>HDR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBtn} onPress={cycleAspectRatio}>
                <Text style={styles.ratioText}>{aspectRatio}</Text>
              </TouchableOpacity>
            </View>

            {/* Zoom controls */}
            <View style={styles.zoomControls}>
              {[0, 0.25, 0.5].map(z => (
                <TouchableOpacity key={z} style={[styles.zoomBtn, zoom === z && { backgroundColor: colors.primary }]} onPress={() => setZoom(z)}>
                  <Text style={[styles.zoomText, zoom === z && { color: '#fff' }]}>{z === 0 ? '1x' : z === 0.25 ? '2x' : '5x'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filter strip */}
          {showFilters && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterStrip, { backgroundColor: colors.surface }]}>
              {filters.map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterItem, activeFilter === f.id && { borderColor: colors.primary, borderWidth: 2 }]}
                  onPress={() => setActiveFilter(f.id)}
                >
                  <View style={[styles.filterPreview, { backgroundColor: f.color || colors.card }]} />
                  <Text style={[styles.filterName, { color: activeFilter === f.id ? colors.primary : colors.textMuted }]}>{f.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Bottom controls */}
          <View style={[styles.bottomControls, { backgroundColor: colors.surface }]}>
            {/* Mode selector */}
            <View style={styles.modeRow}>
              <TouchableOpacity onPress={() => setMode('picture')} style={[styles.modeBtn, mode === 'picture' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
                <Text style={[styles.modeText, { color: mode === 'picture' ? colors.primary : colors.textMuted }]}>{t('camera.photo')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('video')} style={[styles.modeBtn, mode === 'video' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}>
                <Text style={[styles.modeText, { color: mode === 'video' ? colors.accent : colors.textMuted }]}>{t('camera.video')}</Text>
              </TouchableOpacity>
            </View>

            {/* Action row */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.sideBtn} onPress={() => setShowGallery(true)}>
                {capturedPhotos.length > 0 ? (
                  <Image source={{ uri: capturedPhotos[0].uri }} style={styles.lastPhoto} />
                ) : (
                  <Ionicons name="images" size={28} color={colors.textMuted} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shutterBtn, mode === 'video' && isRecording && { borderColor: colors.accent }]}
                onPress={mode === 'picture' ? takePhoto : toggleRecording}
                onLongPress={mode === 'picture' ? takePhoto : undefined}
                disabled={isTimerActive}
              >
                <View style={[styles.shutterInner, mode === 'video' ? { backgroundColor: isRecording ? colors.accent : colors.accent, borderRadius: isRecording ? 8 : 30, width: isRecording ? 28 : 56, height: isRecording ? 28 : 56 } : { backgroundColor: '#fff' }]} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.sideBtn} onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')}>
                <Ionicons name="camera-reverse" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Bottom quick actions */}
            <View style={styles.quickRow}>
              <TouchableOpacity style={styles.quickBtn} onPress={() => setShowFilters(!showFilters)}>
                <Ionicons name="color-filter" size={18} color={showFilters ? colors.primary : colors.textMuted} />
                <Text style={[styles.quickLabel, { color: showFilters ? colors.primary : colors.textMuted }]}>{t('camera.filters')}</Text>
              </TouchableOpacity>
              {facing === 'front' && (
                <TouchableOpacity style={styles.quickBtn} onPress={() => setMirrorSelfie(!mirrorSelfie)}>
                  <Ionicons name="swap-horizontal" size={18} color={mirrorSelfie ? colors.primary : colors.textMuted} />
                  <Text style={[styles.quickLabel, { color: mirrorSelfie ? colors.primary : colors.textMuted }]}>Mirror</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  permTitle: { fontSize: FontSize.title, fontWeight: '800', marginTop: 20 },
  permDesc: { fontSize: FontSize.md, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  permButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: BorderRadius.lg },
  permButtonText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  cameraContainer: { flex: 1, overflow: 'hidden' },
  topControls: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingHorizontal: 16, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, minWidth: 40, alignItems: 'center' },
  topBtnBadge: { position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 3 },
  timerBadge: { color: '#FFD93D', fontSize: 9, fontWeight: '700', marginTop: -2 },
  hdrText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  ratioText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  // Grid
  gridLine: { position: 'absolute', borderWidth: 0.5 },
  gridH1: { top: '33.33%', left: 0, right: 0 },
  gridH2: { top: '66.66%', left: 0, right: 0 },
  gridV1: { left: '33.33%', top: 0, bottom: 0 },
  gridV2: { left: '66.66%', top: 0, bottom: 0 },
  // Timer overlay
  timerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  timerText: { color: '#fff', fontSize: 72, fontWeight: '900' },
  // Zoom
  zoomControls: { position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 4 },
  zoomBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  zoomText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
  // Filters
  filterStrip: { paddingVertical: 10, paddingHorizontal: 8, maxHeight: 80 },
  filterItem: { alignItems: 'center', marginHorizontal: 6, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: 'transparent' },
  filterPreview: { width: 44, height: 44, borderRadius: 8 },
  filterName: { fontSize: 9, marginTop: 3, fontWeight: '600' },
  // Bottom controls
  bottomControls: { paddingBottom: Platform.OS === 'ios' ? 34 : 16, paddingTop: 12 },
  modeRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 16 },
  modeBtn: { paddingBottom: 6, paddingHorizontal: 8 },
  modeText: { fontSize: 14, fontWeight: '700' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40 },
  sideBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lastPhoto: { width: 44, height: 44, borderRadius: 12 },
  shutterBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28 },
  quickRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 12 },
  quickBtn: { alignItems: 'center', gap: 2 },
  quickLabel: { fontSize: 9, fontWeight: '600' },
  // Gallery
  galleryHeader: { paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingBottom: 16, paddingHorizontal: 20 },
  galleryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  galleryTitle: { fontSize: FontSize.title, fontWeight: '800', flex: 1 },
  photoCountBadge: { fontSize: FontSize.lg, fontWeight: '700' },
  emptyGallery: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: FontSize.lg, marginTop: 12, marginBottom: 24 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.lg },
  emptyBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 2 },
  galleryItem: { width: width / 3 - 2, height: width / 3 - 2, margin: 1 },
  galleryImage: { width: '100%', height: '100%', borderRadius: 4 },
  // Preview
  previewOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  previewClose: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40, right: 20, zIndex: 10, padding: 8 },
  previewImage: { width: '100%', height: '80%' },
  deleteBtn: { position: 'absolute', bottom: Platform.OS === 'ios' ? 50 : 30, alignSelf: 'center', padding: 12, backgroundColor: 'rgba(255,100,100,0.2)', borderRadius: 24 },
});
