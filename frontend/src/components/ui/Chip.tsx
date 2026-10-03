import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@theme/index';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function Chip({
  label,
  active = false,
  onPress,
  icon,
  style,
  disabled = false,
}: ChipProps): React.ReactElement {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[
        styles.base,
        active ? styles.active : null,
        disabled ? styles.disabled : null,
        style,
      ]}
      accessibilityRole="button"
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={14}
          color={active ? colors.textInverse : colors.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, active ? styles.labelActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 32,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabled: { opacity: 0.5 },
  icon: { marginRight: 4 },
  label: { ...typography.small, color: colors.textSecondary },
  labelActive: {
    color: colors.textInverse,
    fontFamily: typography.button.fontFamily,
  },
});