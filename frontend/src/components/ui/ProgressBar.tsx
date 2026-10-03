import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@theme/index';

interface ProgressBarProps {
  progress: number; // 0 a 100
  height?: number;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
}

export default function ProgressBar({
  progress,
  height = 6,
  color,
  bgColor = colors.bgSubtle,
  style,
}: ProgressBarProps): React.ReactElement {
  const clamped = Math.min(100, Math.max(0, progress));
  const fillColor = color ?? colors.primary;

  return (
    <View
      style={[
        styles.base,
        { height, borderRadius: height / 2, backgroundColor: bgColor },
        style,
      ]}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: fillColor,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});