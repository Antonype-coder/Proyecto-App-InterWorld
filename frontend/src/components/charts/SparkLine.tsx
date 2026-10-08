import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useColors } from '@hooks/useColors';

interface SparkLineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  style?: ViewStyle;
}

export default function SparkLine({
  data,
  color,
  height = 40,
  width = 100,
  style,
}: SparkLineProps): React.ReactElement {
  const colors = useColors();
  const lineColor = color ?? colors.accent;

  if (data.length === 0) {
    return <View style={[{ width, height }, style]} />;
  }

  const chartData = data.map((value) => ({ value }));

  return (
    <View style={[{ width, height }, style]}>
      <LineChart
        data={chartData}
        height={height}
        width={width}
        color={lineColor}
        thickness={2}
        hideDataPoints
        hideYAxisText
        hideAxesAndRules
        initialSpacing={0}
        endSpacing={0}
        curved
        curvature={0.2}
        backgroundColor="transparent"
      />
    </View>
  );
}

const styles = StyleSheet.create({});