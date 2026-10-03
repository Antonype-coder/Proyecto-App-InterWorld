// src/components/charts/LineChartCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { colors, radius, spacing, typography } from '@theme/index';
import Card from '@components/ui/Card';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartCardProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export default function LineChartCard({
  title,
  subtitle,
  data,
  color = colors.primary,
  height = 200,
  formatValue,
}: LineChartCardProps): React.ReactElement {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.lg * 4;

  const chartData = data.map((d) => ({
    value: d.value,
    label: d.label,
    dataPointText: '',
  }));

  const maxValue = Math.max(...data.map((d) => d.value), 1);

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
        <LineChart
          data={chartData}
          width={chartWidth}
          height={height}
          initialSpacing={12}
          endSpacing={12}
          color={color}
          thickness={2}
          startFillColor={color}
          endFillColor={color}
          startOpacity={0.2}
          endOpacity={0.02}
          areaChart
          curved
          hideDataPoints={data.length > 10}
          dataPointsColor={color}
          dataPointsRadius={4}
          yAxisColor={colors.border}
          xAxisColor={colors.border}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          rulesColor={colors.border}
          rulesType="solid"
          noOfSections={4}
          maxValue={maxValue * 1.2}
          formatYLabel={(v) => {
            const n = parseFloat(v);
            if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
            if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
            return String(Math.round(n));
          }}
          pointerConfig={{
            pointerStripHeight: height - 40,
            pointerStripColor: colors.border,
            pointerStripWidth: 1,
            pointerColor: color,
            radius: 6,
            pointerLabelWidth: 100,
            pointerLabelHeight: 60,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: Array<{ value: number }>) => {
              const v = items[0]?.value ?? 0;
              return (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>
                    {formatValue ? formatValue(v) : String(v)}
                  </Text>
                </View>
              );
            },
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
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  emptyText: { ...typography.caption, color: colors.textMuted },
  tooltip: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tooltipText: {
    color: colors.textInverse,
    fontSize: 12,
    fontFamily: typography.button.fontFamily,
  },
});