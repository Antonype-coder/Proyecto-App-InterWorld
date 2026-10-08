import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@theme/index';

interface ProgressBarProps {
  /** Alias moderno */
  value?: number;
  /** Alias compatible con uso previo */
  progress?: number;
  max?: number;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export default function ProgressBar({
  value,
  progress,
  max = 100,
  height = 6,
  color = colors.primary,
  trackColor = colors.bgSubtle,
  style,
}: ProgressBarProps): React.ReactElement {
  const raw = value ?? progress ?? 0;
  const safeMax = max > 0 ? max : 1;
  const pct = Math.max(0, Math.min(100, (raw / safeMax) * 100));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: safeMax, now: raw }}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${pct}%`,
            height,
            borderRadius: height / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { width: 0 },
});