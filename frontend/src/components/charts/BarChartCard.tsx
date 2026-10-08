import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { radius, spacing, typography, shadows } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface BarDataPoint {
  label: string;
  value: number;
}

interface BarChartCardProps {
  title: string;
  subtitle?: string;
  data: BarDataPoint[];
  formatValue?: (value: number) => string;
  color?: string;
  height?: number;
}

export default function BarChartCard({
  title,
  subtitle,
  data,
  formatValue,
  color,
  height = 180,
}: BarChartCardProps): React.ReactElement {
  const colors = useColors();
  const barColor = color ?? colors.chartPlum ?? colors.accent;

  const chartData = data.map((point) => ({
    value: point.value,
    label: point.label,
    frontColor: barColor,
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
        <BarChart
          data={chartData}
          height={height}
          barWidth={Math.max(8, Math.min(24, 220 / data.length))}
          barBorderTopLeftRadius={4}
          barBorderTopRightRadius={4}
          initialSpacing={4}
          endSpacing={4}
          spacing={6}
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