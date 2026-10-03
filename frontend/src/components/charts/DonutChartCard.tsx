// src/components/charts/DonutChartCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { colors, spacing, typography } from '@theme/index';
import Card from '@components/ui/Card';
import { formatCurrency } from '@utils/format';

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartCardProps {
  title: string;
  subtitle?: string;
  data: Slice[];
}

export default function DonutChartCard({
  title,
  subtitle,
  data,
}: DonutChartCardProps): React.ReactElement {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const pieData = data.map((d) => ({
    value: d.value,
    color: d.color,
    text: total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%',
  }));

  if (total === 0) {
    return (
      <Card variant="default" style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Sin ventas en este período</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="default" style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.chartWrap}>
        <PieChart
          data={pieData}
          donut
          radius={80}
          innerRadius={55}
          innerCircleColor={colors.surface}
          centerLabelComponent={() => (
            <View style={styles.center}>
              <Text style={styles.centerValue}>{formatCurrency(total)}</Text>
              <Text style={styles.centerLabel}>Total</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.legend}>
        {data.map((d, idx) => (
          <View key={idx} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text style={styles.legendLabel}>{d.label}</Text>
            <Text style={styles.legendValue}>{formatCurrency(d.value)}</Text>
          </View>
        ))}
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
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  center: { alignItems: 'center' },
  centerValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 15,
  },
  centerLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },
  legend: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  legendValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.bgSubtle,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  emptyText: { ...typography.caption, color: colors.textMuted },
});