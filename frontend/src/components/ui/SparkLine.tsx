import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '@hooks/useColors';

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  style?: ViewStyle;
}

export default function SparkLine({
  data,
  width = 100,
  height = 32,
  color,
  showArea = true,
  style,
}: SparkLineProps): React.ReactElement {
  const colors = useColors();
  const lineColor = color ?? colors.accent;

  if (data.length < 2) {
    return <View style={[{ width, height }, style]} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const usableHeight = height - padding * 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padding + (1 - (v - min) / range) * usableHeight;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const areaPath =
    `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const gid = `spark-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height}>
        {showArea ? (
          <>
            <Defs>
              <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={lineColor} stopOpacity="0.25" />
                <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path d={areaPath} fill={`url(#${gid})`} />
          </>
        ) : null}
        <Path
          d={linePath}
          stroke={lineColor}
          strokeWidth={1.75}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({});