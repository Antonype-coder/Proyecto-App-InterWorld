import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@theme/index';

interface ProgressDotsProps {
  total: number;
  current: number;
}

export default function ProgressDots({
  total,
  current,
}: ProgressDotsProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current ? styles.dotActive : null]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
  },
  dotActive: { backgroundColor: colors.primary, width: 24 },
});