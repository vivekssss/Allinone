import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  Dimensions, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import GlassCard from '@/components/GlassCard';
import { AuraTheme } from '@/constants/aura-theme';
import { Spacing, FontSize, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

const FILTERS = [
  { id: 'none', name: 'Original', color: 'transparent' },
  { id: 'noir', name: 'Noir', color: 'rgba(0,0,0,0.4)' },
  { id: 'chrome', name: 'Chrome', color: 'rgba(0,229,255,0.1)' },
  { id: 'sepia', name: 'Sepia', color: 'rgba(112,66,20,0.3)' },
  { id: 'flare', name: 'Flare', color: 'rgba(255,107,107,0.15)' },
  { id: 'aura', name: 'Aura', color: 'rgba(124,77,255,0.2)' },
];

export default function MediaEditor() {
  const router = useRouter();
  const { uri, id } = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // In a real app, we'd use gl-react or expo-pixi to process.
    // Here we simulate the process.
    await new Promise(r => setTimeout(r, 2000));
    setSaving(false);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Media</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color={AuraTheme.dark.primary} /> : (
            <Text style={{ color: AuraTheme.dark.secondary, fontWeight: '800' }}>SAVE</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.previewContainer}>
        {uri ? (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: uri as string }} style={styles.previewImage} resizeMode="contain" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: selectedFilter.color }]} />
          </View>
        ) : (
          <ActivityIndicator color="#fff" />
        )}
      </View>

      <View style={styles.controls}>
        <Text style={styles.sectionTitle}>Aura Filters</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {FILTERS.map((filter) => (
            <TouchableOpacity 
              key={filter.id} 
              style={[styles.filterBtn, selectedFilter.id === filter.id && styles.activeFilter]}
              onPress={() => setSelectedFilter(filter)}
            >
              <View style={[styles.filterPreview, { backgroundColor: filter.color || '#333' }]} />
              <Text style={styles.filterName}>{filter.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.toolRow}>
          <TouchableOpacity style={styles.toolBtn}>
            <Ionicons name="crop" size={20} color="#fff" />
            <Text style={styles.toolText}>Crop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn}>
            <Ionicons name="sunny" size={20} color="#fff" />
            <Text style={styles.toolText}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn}>
            <Ionicons name="color-palette" size={20} color="#fff" />
            <Text style={styles.toolText}>Hue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageWrapper: { width: width, height: width * 1.2, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  controls: { backgroundColor: '#070A1A', padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 15 },
  filterBtn: { alignItems: 'center', width: 70 },
  filterPreview: { width: 60, height: 60, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterName: { color: '#fff', fontSize: 11, fontWeight: '600' },
  activeFilter: { opacity: 1 },
  toolRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  toolBtn: { alignItems: 'center', gap: 6 },
  toolText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },
});
