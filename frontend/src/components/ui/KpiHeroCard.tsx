import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { spacing, radius, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import SparkLine from './SparkLine';

interface KpiHeroCardProps {
  label: string;
  value: number;
  formatValue: (n: number) => string;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    percentage: number;
  };
  sparkData?: number[];
  sparkColor?: string;
  style?: ViewStyle;
}

export default function KpiHeroCard({
  label,
  value,
  formatValue,
  subtitle,
  trend,
  sparkData,
  sparkColor,
  style,
}: KpiHeroCardProps): React.ReactElement {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
        {trend ? (
          <TrendBadgeInline
            direction={trend.direction}
            percentage={trend.percentage}
          />
        ) : null}
      </View>

      <Text
        style={[styles.value, { color: colors.textPrimary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatValue(value)}
      </Text>

      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      ) : null}

      {sparkData && sparkData.length >= 2 ? (
        <SparkLine
          data={sparkData}
          width={undefined as any}
          height={40}
          color={sparkColor ?? colors.accent}
          style={styles.spark}
        />
      ) : null}
    </View>
  );
}

function TrendBadgeInline({
  direction,
  percentage,
}: {
  direction: 'up' | 'down' | 'flat';
  percentage: number;
}): React.ReactElement {
  const colors = useColors();
  const isUp = direction === 'up';
  const isDown = direction === 'down';

  const bg = isUp
    ? colors.successSubtle
    : isDown
      ? colors.dangerSubtle
      : colors.bgSubtle;

  const tint = isUp
    ? colors.successText
    : isDown
      ? colors.dangerText
      : colors.textMuted;

  const icon = isUp ? '↑' : isDown ? '↓' : '−';

  return (
    <View style={[styles.trendBadge, { backgroundColor: bg }]}>
      <Text style={[styles.trendIcon, { color: tint }]}>{icon}</Text>
      <Text style={[styles.trendText, { color: tint }]}>
        {Math.abs(percentage).toFixed(1)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: { ...typography.small },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  trendIcon: {
    fontSize: 12,
    fontFamily: typography.button.fontFamily,
    lineHeight: 14,
  },
  trendText: {
    fontSize: 11,
    fontFamily: typography.button.fontFamily,
  },
  value: {
    ...typography.display,
    letterSpacing: -0.8,
  },
  subtitle: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  spark: {
    marginTop: spacing.md,
    marginHorizontal: -spacing.lg,
    marginBottom: -spacing.lg,
  },
});