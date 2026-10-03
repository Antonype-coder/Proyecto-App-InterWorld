import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { colors, radius, spacing, shadows } from '@theme/index';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'elevated' | 'ghost';
  padding?: number;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export default function Card({
  children,
  variant = 'default',
  padding = spacing.lg,
  onPress,
  style,
  accessibilityLabel,
}: CardProps): React.ReactElement {
  const variantStyle = getVariantStyle(variant);

  const content = (
    <View style={[styles.base, variantStyle, { padding }, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => (pressed ? styles.pressed : null)}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

function getVariantStyle(
  variant: 'default' | 'flat' | 'elevated' | 'ghost',
): ViewStyle {
  switch (variant) {
    case 'flat':
      return { backgroundColor: colors.bgSubtle };
    case 'elevated':
      return { backgroundColor: colors.surface, ...shadows.md };
    case 'ghost':
      return { backgroundColor: 'transparent' };
    case 'default':
    default:
      return {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.7 },
});