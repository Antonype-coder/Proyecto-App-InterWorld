import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { usePressAnimation } from '@hooks/usePressAnimation';
import type { AppColors } from '@theme/index';
import type { ButtonVariant, ButtonSize } from '@tipos/index';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const DANGER_TEXT = '#FFFFFF';

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  accessibilityLabel,
}: ButtonProps): React.ReactElement {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const config = getVariantConfig(variant, size, colors);
  const press = usePressAnimation({ enable: !isDisabled });

  return (
    <Animated.View
      style={[
        fullWidth ? styles.fullWidth : null,
        style,
        press.style,
      ]}
    >
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[styles.base, config.container, isDisabled ? styles.disabled : null]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={config.text.color as string} />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' ? (
              <MaterialCommunityIcons
                name={icon}
                size={config.iconSize}
                color={config.text.color as string}
                style={styles.iconLeft}
              />
            ) : null}

            <Text style={[styles.label, config.text]} numberOfLines={1}>
              {label}
            </Text>

            {icon && iconPosition === 'right' ? (
              <MaterialCommunityIcons
                name={icon}
                size={config.iconSize}
                color={config.text.color as string}
                style={styles.iconRight}
              />
            ) : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function getVariantConfig(
  variant: ButtonVariant,
  size: ButtonSize,
  colors: AppColors,
) {
  const heights = { sm: 32, md: 40, lg: 48 };
  const paddingsH = { sm: 12, md: 16, lg: 20 };
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 15 : 14;
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  const base: ViewStyle = {
    height: heights[size],
    paddingHorizontal: paddingsH[size],
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  };

  switch (variant) {
    case 'primary':
      return {
        container: { ...base, backgroundColor: colors.primary },
        text: { color: colors.textInverse, fontSize } as TextStyle,
        iconSize,
      };
    case 'accent':
      return {
        container: { ...base, backgroundColor: colors.accent },
        text: { color: DANGER_TEXT, fontSize } as TextStyle,
        iconSize,
      };
    case 'outline':
      return {
        container: {
          ...base,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderStrong,
        },
        text: { color: colors.textPrimary, fontSize } as TextStyle,
        iconSize,
      };
    case 'danger':
      return {
        container: { ...base, backgroundColor: colors.danger },
        text: { color: DANGER_TEXT, fontSize } as TextStyle,
        iconSize,
      };
    case 'ghost':
    default:
      return {
        container: { ...base, backgroundColor: 'transparent' },
        text: { color: colors.textPrimary, fontSize } as TextStyle,
        iconSize,
      };
  }
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row' },
  fullWidth: { width: '100%' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.button },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
  disabled: { opacity: 0.4 },
});