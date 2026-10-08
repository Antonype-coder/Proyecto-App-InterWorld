import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@theme/index';

interface ProgressDotsProps {
  total: number;
  current: number;
  style?: ViewStyle;
}

export default function ProgressDots({
  total,
  current,
  style,
}: ProgressDotsProps): React.ReactElement {
  return (
    <View style={[styles.row, style]} accessibilityRole="progressbar">
      {Array.from({ length: total }).map((_, index) => {
        const active = index === current;
        return (
          <View
            key={index}
            style={[styles.dot, active ? styles.dotActive : null]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
});