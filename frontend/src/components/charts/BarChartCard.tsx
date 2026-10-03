// src/components/charts/BarChartCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { colors, radius, spacing, typography } from '@theme/index';
import Card from '@components/ui/Card';

interface DataPoint {
  label: string;
  value: number;
}

interface BarChartCardProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export default function BarChartCard({
  title,
  subtitle,
  data,
  color = colors.accent,
  height = 180,
  formatValue,
}: BarChartCardProps): React.ReactElement {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.lg * 4;

  // Filtrar horas sin actividad para no saturar
  const dataConActividad = data.filter((d) => d.value > 0);
  const dataFinal = dataConActividad.length > 0 ? dataConActividad : data;

  const chartData = dataFinal.map((d) => ({
    value: d.value,
    label: d.label,
    frontColor: color,
    topLabelComponent: () =>
      d.value > 0 ? (
        <Text style={styles.barLabel}>
          {formatValue ? formatValue(d.value) : String(d.value)}
        </Text>
      ) : null,
  }));

  const maxValue = Math.max(...dataFinal.map((d) => d.value), 1);

  if (data.length === 0) {
    return (
      <Card variant="default" style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={[styles.empty, { height }]}>
          <Text style={styles.emptyText}>Sin datos suficientes</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="default" style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.chartWrap}>
        <BarChart
          data={chartData}
          width={chartWidth}
          height={height}
          barWidth={dataFinal.length > 8 ? 14 : 22}
          initialSpacing={10}
          spacing={dataFinal.length > 8 ? 6 : 12}
          barBorderRadius={4}
          yAxisColor={colors.border}
          xAxisColor={colors.border}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          rulesColor={colors.border}
          rulesType="solid"
          noOfSections={3}
          maxValue={maxValue * 1.2}
          formatYLabel={(v) => {
            const n = parseFloat(v);
            if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
            if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
            return String(Math.round(n));
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary },
  subtitle: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  chartWrap: {
    marginTop: spacing.md,
    marginLeft: -spacing.md,
  },
  axisText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  barLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginBottom: 2,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  emptyText: { ...typography.caption, color: colors.textMuted },
});