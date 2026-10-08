import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated } from 'react-native';
import { radius, spacing, shadows } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { usePressAnimation } from '@hooks/usePressAnimation';
import type { AppColors } from '@theme/index';

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
  const colors = useColors();
  const variantStyle = getVariantStyle(variant, colors);
  const press = usePressAnimation({ enable: !!onPress });

  const content = (
    <View style={[styles.base, variantStyle, { padding }, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={press.style}>
        <Pressable
          onPress={onPress}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return content;
}

function getVariantStyle(
  variant: 'default' | 'flat' | 'elevated' | 'ghost',
  colors: AppColors,
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
});