import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gradient?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  noPadding?: boolean;
}

export default function GlassCard({
  children,
  style,
  gradient = false,
  gradientColors,
  noPadding = false,
}: GlassCardProps) {
  if (gradient) {
    return (
      <LinearGradient
        colors={gradientColors || [Colors.gradient1Start, Colors.gradient1End]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientCard, !noPadding && styles.padding, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, !noPadding && styles.padding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.card,
  },
  gradientCard: {
    borderRadius: BorderRadius.lg,
    ...Shadows.glow,
  },
  padding: {
    padding: Spacing.lg,
  },
});
