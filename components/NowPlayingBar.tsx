import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Shadows, BorderRadius } from '@/constants/theme';

interface NowPlayingBarProps {
  title: string;
  artist: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  progress?: number;
}

export default function NowPlayingBar({
  title,
  artist,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  progress = 0,
}: NowPlayingBarProps) {
  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        {/* Album art placeholder */}
        <View style={styles.albumArt}>
          <Ionicons name="musical-notes" size={24} color={Colors.primary} />
        </View>

        {/* Track info */}
        <View style={styles.trackInfo}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={onPrevious} style={styles.controlBtn}>
            <Ionicons name="play-skip-back" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPlayPause} style={styles.playBtn}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={22}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext} style={styles.controlBtn}>
            <Ionicons name="play-skip-forward" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    ...Shadows.card,
  },
  progressBar: {
    height: 2,
    backgroundColor: Colors.card,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  albumArt: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  controlBtn: {
    padding: Spacing.xs,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
