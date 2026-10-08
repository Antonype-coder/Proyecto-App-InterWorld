import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { radius, spacing, typography, shadows } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface DonutDataPoint {
  label: string;
  value: number;
  color: string;
}

interface DonutChartCardProps {
  title: string;
  subtitle?: string;
  data: DonutDataPoint[];
  centerColor?: string;
}

export default function DonutChartCard({
  title,
  subtitle,
  data,
  centerColor,
}: DonutChartCardProps): React.ReactElement {
  const colors = useColors();

  const pieData = data.map((point) => ({
    value: point.value,
    color: point.color,
    text: '',
  }));

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const centerTint = centerColor ?? colors.textPrimary;

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

      {data.length === 0 || total === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Sin datos disponibles
        </Text>
      ) : (
        <View style={styles.body}>
          <View style={styles.chartWrapper}>
            <PieChart
              data={pieData}
              donut
              radius={72}
              innerRadius={48}
              innerCircleColor={colors.surface}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text
                    style={[
                      styles.centerValue,
                      { color: centerTint },
                    ]}
                  >
                    {total >= 1000
                      ? `${(total / 1000).toFixed(1)}k`
                      : String(Math.round(total))}
                  </Text>
                  <Text
                    style={[styles.centerSub, { color: colors.textMuted }]}
                  >
                    Total
                  </Text>
                </View>
              )}
            />
          </View>

          <View style={styles.legend}>
            {data.map((point, idx) => {
              const pct = total > 0 ? (point.value / total) * 100 : 0;
              return (
                <View key={idx} style={styles.legendRow}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: point.color },
                    ]}
                  />
                  <View style={styles.legendContent}>
                    <Text
                      style={[
                        styles.legendLabel,
                        { color: colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {point.label}
                    </Text>
                    <Text
                      style={[
                        styles.legendPct,
                        { color: colors.textMuted },
                      ]}
                    >
                      {pct.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
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
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: { ...typography.h3 },
  centerSub: { ...typography.small, marginTop: 2 },
  legend: { flex: 1, gap: spacing.sm },
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
  legendContent: { flex: 1, minWidth: 0 },
  legendLabel: { ...typography.small },
  legendPct: { ...typography.tiny, marginTop: 1 },
  empty: {
    ...typography.caption,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});