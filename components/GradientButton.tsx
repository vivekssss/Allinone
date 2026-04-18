import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '@/constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: string[];
  style?: ViewStyle;
  textStyle?: any;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function GradientButton({
  title,
  onPress,
  colors,
  style,
  textStyle,
  disabled = false,
  loading = false,
  icon,
  size = 'md',
}: GradientButtonProps) {
  const sizeStyles = {
    sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
    md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
    lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
  };

  const fontSizes = {
    sm: FontSize.sm,
    md: FontSize.md,
    lg: FontSize.lg,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.wrapper, style]}
    >
      <LinearGradient
        colors={colors || [Colors.gradient1Start, Colors.gradient1End]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          sizeStyles[size],
          disabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, { fontSize: fontSizes[size] }, textStyle]}>
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...Shadows.glow,
  },
  gradient: {
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  text: {
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
});
