import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';

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
  const colors = useColors();

  const bg = active ? colors.primary : colors.surface;
  const border = active ? colors.primary : colors.border;
  const textColor = active ? colors.textInverse : colors.textSecondary;
  const iconColor = active ? colors.textInverse : colors.textSecondary;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[
        styles.base,
        { backgroundColor: bg, borderColor: border },
        disabled ? styles.disabled : null,
        style,
      ]}
      accessibilityRole="button"
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={14}
          color={iconColor}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          { color: textColor },
          active ? styles.labelActive : null,
        ]}
      >
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
    borderWidth: 1,
  },
  disabled: { opacity: 0.5 },
  icon: { marginRight: 4 },
  label: { ...typography.small },
  labelActive: {
    fontFamily: typography.button.fontFamily,
  },
});