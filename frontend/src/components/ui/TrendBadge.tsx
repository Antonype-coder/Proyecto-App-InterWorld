import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface TrendBadgeProps {
  direction: 'up' | 'down' | 'flat';
  percentage: number;
  /** Si true, invierte los colores (para gastos: subir es malo). */
  invert?: boolean;
  size?: 'sm' | 'md';
}

export default function TrendBadge({
  direction,
  percentage,
  invert = false,
  size = 'md',
}: TrendBadgeProps): React.ReactElement {
  const colors = useColors();

  const isUp = direction === 'up';
  const isDown = direction === 'down';
  const isFlat = direction === 'flat';

  const positive = invert ? isDown : isUp;
  const negative = invert ? isUp : isDown;

  const bg = positive
    ? colors.successSubtle
    : negative
      ? colors.dangerSubtle
      : colors.bgSubtle;

  const tint = positive
    ? colors.successText
    : negative
      ? colors.dangerText
      : colors.textMuted;

  const icon = isUp ? 'arrow-up' : isDown ? 'arrow-down' : 'minus';

  const small = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bg,
          paddingHorizontal: small ? 6 : 8,
          paddingVertical: small ? 2 : 4,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={small ? 11 : 13}
        color={tint}
      />
      <Text style={[styles.text, { color: tint, fontSize: small ? 10 : 12 }]}>
        {isFlat ? '0' : `${Math.abs(percentage).toFixed(1)}`}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.pill,
  },
  text: {
    fontFamily: typography.button.fontFamily,
  },
});