import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, shadows, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import type { AppColors } from '@theme/index';
import type { ToastVariant } from '@tipos/index';

interface ToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onHide: () => void;
}

export default function Toast({
  visible,
  message,
  variant = 'info',
  duration = 2800,
  onHide,
}: ToastProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -12,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, duration, opacity, translateY, onHide]);

  if (!visible) return null;

  const config = getConfig(variant, colors);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + spacing.sm,
          backgroundColor: config.bg,
          borderLeftColor: config.accent,
          borderColor: colors.border,
          opacity,
          transform: [{ translateY }],
        },
        shadows.lg,
      ]}
    >
      <MaterialCommunityIcons
        name={config.icon}
        size={18}
        color={config.text}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: config.text }]} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

function getConfig(
  variant: ToastVariant,
  colors: AppColors,
): {
  bg: string;
  text: string;
  accent: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
} {
  switch (variant) {
    case 'success':
      return {
        bg: colors.successSubtle,
        text: colors.successText,
        accent: colors.success,
        icon: 'check-circle-outline',
      };
    case 'error':
      return {
        bg: colors.dangerSubtle,
        text: colors.dangerText,
        accent: colors.danger,
        icon: 'alert-circle-outline',
      };
    case 'warning':
      return {
        bg: colors.warningSubtle,
        text: colors.warningText,
        accent: colors.warning,
        icon: 'alert-outline',
      };
    case 'info':
    default:
      return {
        bg: colors.infoSubtle,
        text: colors.infoText,
        accent: colors.info,
        icon: 'information-outline',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
  },
  icon: { marginRight: spacing.sm },
  text: { ...typography.bodyBold, flex: 1 },
});