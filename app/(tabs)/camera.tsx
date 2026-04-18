import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Dimensions, Image, FlatList, Modal, ScrollView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '@/components/GlassCard';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
  timestamp: Date;
}

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [zoom, setZoom] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [showFlash, setShowFlash] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaPermission(status === 'granted');
    })();
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient colors={[Colors.primary + '20', Colors.background]} style={styles.permissionGradient}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionText}>Allow ClosingAll to access your camera to take photos and record videos.</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.permissionBtnGrad}>
              <Ionicons name="lock-open" size={20} color="#fff" />
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const toggleCamera = () => setFacing(prev => prev === 'back' ? 'front' : 'back');

  const toggleFlash = () => {
    const modes: FlashMode[] = ['off', 'on', 'auto'];
    const idx = modes.indexOf(flash);
    setFlash(modes[(idx + 1) % modes.length]);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}

    // Flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) {
        const newPhoto: CapturedPhoto = {
          uri: photo.uri,
          width: photo.width || 0,
          height: photo.height || 0,
          timestamp: new Date(),
        };
        setCapturedPhotos(prev => [newPhoto, ...prev]);
        setPhotoCount(prev => prev + 1);

        if (mediaPermission) {
          await MediaLibrary.saveToLibraryAsync(photo.uri);
        }

        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
    } catch (e) {
      console.log('Photo error:', e);
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const toggleRecording = async () => {
    if (!cameraRef.current) return;
    if (isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
      try {
        const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
        if (video?.uri && mediaPermission) {
          await MediaLibrary.saveToLibraryAsync(video.uri);
          Alert.alert('✅ Video Saved', 'Your video has been saved to the gallery.');
        }
      } catch (e) { console.log('Video error:', e); }
      setIsRecording(false);
    }
  };

  const deletePhoto = (photo: CapturedPhoto) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setCapturedPhotos(prev => prev.filter(p => p.uri !== photo.uri));
        setSelectedPhoto(null);
      }},
    ]);
  };

  const flashIcons: Record<string, keyof typeof Ionicons.glyphMap> = { off: 'flash-off', on: 'flash', auto: 'flash-outline' };

  return (
    <View style={styles.container}>
      {showGallery ? (
        /* Photo Gallery View */
        <View style={styles.galleryContainer}>
          <LinearGradient colors={[Colors.primary + '20', Colors.background]} style={styles.galleryHeader}>
            <TouchableOpacity onPress={() => setShowGallery(false)} style={styles.galleryBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.galleryTitle}>📷 My Photos ({capturedPhotos.length})</Text>
            <View style={{ width: 36 }} />
          </LinearGradient>

          {capturedPhotos.length === 0 ? (
            <View style={styles.emptyGallery}>
              <Ionicons name="images-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyGalleryTitle}>No Photos Yet</Text>
              <Text style={styles.emptyGalleryText}>Take some photos using the camera!</Text>
              <TouchableOpacity style={styles.backToCamBtn} onPress={() => setShowGallery(false)}>
                <Text style={styles.backToCamText}>Open Camera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={capturedPhotos}
              numColumns={3}
              keyExtractor={(item, i) => item.uri + i}
              contentContainerStyle={styles.galleryGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.galleryItem}
                  onPress={() => setSelectedPhoto(item)}
                >
                  <Image source={{ uri: item.uri }} style={styles.galleryThumb} />
                  <Text style={styles.galleryItemTime}>
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : (
        /* Camera View */
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} flash={flash} zoom={zoom}>
          {/* Flash overlay */}
          {showFlash && <View style={styles.flashOverlay} />}

          {/* Top Controls */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.topBtn} onPress={toggleFlash}>
              <Ionicons name={flashIcons[flash]} size={24} color="#fff" />
              <Text style={styles.topBtnLabel}>{flash.toUpperCase()}</Text>
            </TouchableOpacity>

            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'photo' && styles.modeTabActive]}
                onPress={() => setMode('photo')}
              >
                <Ionicons name="camera" size={14} color={mode === 'photo' ? '#fff' : 'rgba(255,255,255,0.6)'} />
                <Text style={[styles.modeTabText, mode === 'photo' && styles.modeTabTextActive]}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'video' && styles.modeTabActive]}
                onPress={() => setMode('video')}
              >
                <Ionicons name="videocam" size={14} color={mode === 'video' ? '#fff' : 'rgba(255,255,255,0.6)'} />
                <Text style={[styles.modeTabText, mode === 'video' && styles.modeTabTextActive]}>Video</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.topBtn} onPress={() => setShowGallery(true)}>
              <Ionicons name="images" size={24} color="#fff" />
              {capturedPhotos.length > 0 && (
                <View style={styles.photoBadge}>
                  <Text style={styles.photoBadgeText}>{capturedPhotos.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Recording Indicator */}
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>REC</Text>
            </View>
          )}

          {/* Photo Count */}
          {photoCount > 0 && !isRecording && (
            <View style={styles.photoCountBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.photoCountText}>{photoCount} photos taken</Text>
            </View>
          )}

          {/* Zoom */}
          <View style={styles.zoomContainer}>
            <View style={styles.zoomSlider}>
              {[0, 0.25, 0.5, 0.75, 1].map(z => (
                <TouchableOpacity key={z} style={[styles.zoomDot, zoom === z && styles.zoomDotActive]} onPress={() => setZoom(z)}>
                  <Text style={[styles.zoomDotText, zoom === z && styles.zoomDotTextActive]}>
                    {z === 0 ? '1x' : `${(1 + z * 4).toFixed(0)}x`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.preview} onPress={() => {
              if (capturedPhotos.length > 0) setShowGallery(true);
            }}>
              {capturedPhotos.length > 0 ? (
                <Image source={{ uri: capturedPhotos[0].uri }} style={styles.previewImage} />
              ) : (
                <Ionicons name="images-outline" size={24} color={Colors.textMuted} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureOuter} onPress={mode === 'photo' ? takePicture : toggleRecording}>
              <View style={[styles.captureInner, mode === 'video' && styles.captureVideo, isRecording && styles.captureRecording]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.flipBtn} onPress={toggleCamera}>
              <Ionicons name="camera-reverse" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </CameraView>
      )}

      {/* Full Photo Viewer Modal */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
        <View style={styles.viewerContainer}>
          {selectedPhoto && (
            <>
              <Image source={{ uri: selectedPhoto.uri }} style={styles.viewerImage} resizeMode="contain" />

              <View style={styles.viewerTopBar}>
                <TouchableOpacity onPress={() => setSelectedPhoto(null)} style={styles.viewerBtn}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.viewerDate}>{selectedPhoto.timestamp.toLocaleString()}</Text>
                <TouchableOpacity onPress={() => deletePhoto(selectedPhoto)} style={styles.viewerBtn}>
                  <Ionicons name="trash-outline" size={24} color={Colors.accent} />
                </TouchableOpacity>
              </View>

              <View style={styles.viewerBottomBar}>
                <View style={styles.viewerInfo}>
                  <Text style={styles.viewerInfoText}>
                    {selectedPhoto.width} × {selectedPhoto.height}
                  </Text>
                  <Text style={styles.viewerInfoText}>
                    {selectedPhoto.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  // Permission
  permissionContainer: { flex: 1, backgroundColor: Colors.background },
  permissionGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  permissionIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, borderWidth: 2, borderColor: Colors.primary + '30' },
  permissionTitle: { color: Colors.textPrimary, fontSize: FontSize.title, fontWeight: '800', marginBottom: Spacing.sm },
  permissionText: { color: Colors.textMuted, fontSize: FontSize.md, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  permissionBtn: { width: '100%' },
  permissionBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: BorderRadius.xl },
  permissionBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  // Camera Controls
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: Spacing.lg },
  topBtn: { alignItems: 'center', gap: 2, position: 'relative' },
  topBtnLabel: { color: '#fff', fontSize: 10, fontWeight: '600' },
  photoBadge: { position: 'absolute', top: -6, right: -8, backgroundColor: Colors.accent, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  photoBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  modeTabs: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: BorderRadius.full, padding: 3 },
  modeTab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full },
  modeTabActive: { backgroundColor: Colors.primary },
  modeTabText: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.sm, fontWeight: '600' },
  modeTabTextActive: { color: '#fff' },
  flashOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'white', zIndex: 100 },
  recordingIndicator: { position: 'absolute', top: Platform.OS === 'ios' ? 110 : 95, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,0,0,0.8)', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, gap: 6 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  recordingText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  photoCountBadge: { position: 'absolute', top: Platform.OS === 'ios' ? 110 : 95, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, gap: 6 },
  photoCountText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '600' },
  zoomContainer: { position: 'absolute', bottom: 155, alignSelf: 'center' },
  zoomSlider: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: BorderRadius.full, padding: 4, gap: 2 },
  zoomDot: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  zoomDotActive: { backgroundColor: Colors.primary },
  zoomDotText: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs, fontWeight: '600' },
  zoomDotTextActive: { color: '#fff' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: Spacing.lg, backgroundColor: 'rgba(0,0,0,0.4)' },
  preview: { width: 52, height: 52, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  captureOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  captureVideo: { backgroundColor: Colors.accent },
  captureRecording: { width: 32, height: 32, borderRadius: 6, backgroundColor: Colors.accent },
  flipBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  // Gallery
  galleryContainer: { flex: 1, backgroundColor: Colors.background },
  galleryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg },
  galleryBack: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.glass, alignItems: 'center', justifyContent: 'center' },
  galleryTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '800' },
  emptyGallery: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyGalleryTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '700' },
  emptyGalleryText: { color: Colors.textMuted, fontSize: FontSize.md },
  backToCamBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, marginTop: Spacing.md },
  backToCamText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  galleryGrid: { padding: Spacing.xs },
  galleryItem: { width: (width - Spacing.xs * 4) / 3, height: (width - Spacing.xs * 4) / 3, margin: Spacing.xs / 2, borderRadius: BorderRadius.sm, overflow: 'hidden', backgroundColor: Colors.card },
  galleryThumb: { width: '100%', height: '100%' },
  galleryItemTime: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, fontWeight: '600', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  // Viewer
  viewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '100%' },
  viewerTopBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 54 : 36, paddingHorizontal: Spacing.lg, backgroundColor: 'rgba(0,0,0,0.5)' },
  viewerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  viewerDate: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
  viewerBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: Spacing.md, paddingHorizontal: Spacing.lg, backgroundColor: 'rgba(0,0,0,0.5)' },
  viewerInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  viewerInfoText: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm },
});
