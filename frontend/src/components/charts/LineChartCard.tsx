import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { radius, spacing, typography, shadows } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface LineDataPoint {
  label: string;
  value: number;
}

interface LineChartCardProps {
  title: string;
  subtitle?: string;
  data: LineDataPoint[];
  formatValue?: (value: number) => string;
  color?: string;
  height?: number;
}

export default function LineChartCard({
  title,
  subtitle,
  data,
  formatValue,
  color,
  height = 200,
}: LineChartCardProps): React.ReactElement {
  const colors = useColors();
  const lineColor = color ?? colors.chartWine ?? colors.accent;

  const chartData = data.map((point, index) => ({
    value: point.value,
    label: index % Math.ceil(data.length / 6) === 0 ? point.label : '',
    dataPointText: '',
  }));

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        shadows.xs,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {data.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Sin datos disponibles
        </Text>
      ) : (
        <LineChart
          data={chartData}
          height={height}
          initialSpacing={0}
          endSpacing={8}
          color={lineColor}
          thickness={2}
          hideDataPoints={false}
          dataPointsColor={lineColor}
          dataPointsRadius={3}
          curved
          curvature={0.15}
          backgroundColor="transparent"
          yAxisColor={colors.border}
          xAxisColor={colors.border}
          rulesColor={colors.border}
          rulesType="dashed"
          yAxisTextStyle={{
            color: colors.textMuted,
            fontSize: 10,
          }}
          xAxisLabelTextStyle={{
            color: colors.textMuted,
            fontSize: 10,
          }}
          formatYLabel={(value) => {
            const numeric = parseFloat(value);
            if (formatValue) return formatValue(numeric);
            if (numeric >= 1000) return `${(numeric / 1000).toFixed(0)}k`;
            return String(Math.round(numeric));
          }}
          noOfSections={4}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  header: { marginBottom: spacing.lg },
  title: { ...typography.h3 },
  subtitle: {
    ...typography.small,
    marginTop: 2,
  },
  empty: {
    ...typography.caption,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});