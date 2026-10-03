import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, typography } from '@theme/index';
import type { BadgeVariant } from '@tipos/index';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export default function Badge({
  label,
  variant = 'neutral',
  icon,
  size = 'md',
  style,
}: BadgeProps): React.ReactElement {
  const palette = getPalette(variant);
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: palette.bg,
          paddingVertical: isSmall ? 2 : 3,
          paddingHorizontal: isSmall ? 6 : 8,
        },
        variant === 'outline'
          ? { borderWidth: 1, borderColor: colors.border }
          : null,
        style,
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={isSmall ? 10 : 12}
          color={palette.text}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          { color: palette.text, fontSize: isSmall ? 10 : 11 },
        ]}
        numberOfLines={1}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function getPalette(variant: BadgeVariant): { bg: string; text: string } {
  switch (variant) {
    case 'success':
      return { bg: colors.successSubtle, text: colors.successText };
    case 'danger':
      return { bg: colors.dangerSubtle, text: colors.dangerText };
    case 'warning':
      return { bg: colors.warningSubtle, text: colors.warningText };
    case 'info':
      return { bg: colors.infoSubtle, text: colors.infoText };
    case 'accent':
      return { bg: colors.accentSubtle, text: colors.accentText };
    case 'outline':
      return { bg: 'transparent', text: colors.textSecondary };
    case 'neutral':
    default:
      return { bg: colors.bgSubtle, text: colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
  },
  icon: { marginRight: 3 },
  label: {
    fontFamily: typography.button.fontFamily,
    letterSpacing: 0.4,
  },
});