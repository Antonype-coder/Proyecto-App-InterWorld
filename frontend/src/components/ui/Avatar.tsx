import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '@theme/index';
import { getInitials } from '@utils/format';

interface AvatarProps {
  nombre: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  bgColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

const SIZES = {
  xs: { dim: 24, font: 10 },
  sm: { dim: 32, font: 12 },
  md: { dim: 40, font: 14 },
  lg: { dim: 56, font: 20 },
  xl: { dim: 72, font: 26 },
};

export default function Avatar({
  nombre,
  size = 'md',
  bgColor,
  textColor = colors.textInverse,
  style,
}: AvatarProps): React.ReactElement {
  const dim = SIZES[size];
  const bg = bgColor ?? getColorFromName(nombre);

  return (
    <View
      style={[
        styles.base,
        {
          width: dim.dim,
          height: dim.dim,
          borderRadius: dim.dim / 2,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Text
        style={[styles.label, { color: textColor, fontSize: dim.font }]}
        numberOfLines={1}
      >
        {getInitials(nombre)}
      </Text>
    </View>
  );
}

function getColorFromName(nombre: string): string {
  const palette = [
    '#4F46E5',
    '#0891B2',
    '#059669',
    '#D97706',
    '#DC2626',
    '#7C3AED',
    '#DB2777',
    '#0F766E',
  ];

  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }

  return palette[Math.abs(hash) % palette.length];
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  label: {
    fontFamily: typography.button.fontFamily,
    letterSpacing: 0.3,
  },
});