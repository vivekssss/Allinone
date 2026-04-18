import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '@/constants/theme';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  subValue?: string;
  color?: string;
  percentage?: number;
}

export default function StatCard({
  icon,
  label,
  value,
  subValue,
  color = Colors.primary,
  percentage,
}: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subValue && <Text style={styles.subValue}>{subValue}</Text>}
      {percentage !== undefined && (
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: percentage > 80 ? Colors.error : percentage > 50 ? Colors.warning : color,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    alignItems: 'center',
    flex: 1,
    minWidth: 140,
    ...Shadows.soft,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: 2,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subValue: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.card,
    borderRadius: 2,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
