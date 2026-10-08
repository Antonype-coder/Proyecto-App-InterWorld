import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, radius, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import AnimatedNumber from './AnimatedNumber';
import TrendBadge from './TrendBadge';

type StatTone =
  | 'primary'
  | 'wine'
  | 'plum'
  | 'berry'
  | 'mauve'
  | 'smoke'
  | 'cocoa';

interface StatCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number;
  formatValue: (n: number) => string;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    percentage: number;
  };
  tone?: StatTone;
  style?: ViewStyle;
}

export default function StatCard({
  icon,
  label,
  value,
  formatValue,
  subtitle,
  trend,
  tone = 'primary',
  style,
}: StatCardProps): React.ReactElement {
  const colors = useColors();

  const toneColor =
    tone === 'wine'
      ? colors.chartWine
      : tone === 'plum'
        ? colors.chartPlum
        : tone === 'berry'
          ? colors.chartBerry
          : tone === 'mauve'
            ? colors.chartMauve
            : tone === 'smoke'
              ? colors.chartSmoke
              : tone === 'cocoa'
                ? colors.chartCocoa
                : colors.chartPrimary;

  const toneBg =
    tone === 'wine'
      ? colors.chartWineSubtle
      : tone === 'plum'
        ? colors.chartPlumSubtle
        : tone === 'berry'
          ? colors.chartBerrySubtle
          : tone === 'mauve'
            ? colors.chartMauveSubtle
            : tone === 'smoke'
              ? colors.chartSmokeSubtle
              : tone === 'cocoa'
                ? colors.chartCocoaSubtle
                : colors.chartPrimarySubtle;

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
        <View style={[styles.iconWrap, { backgroundColor: toneBg }]}>
          <MaterialCommunityIcons name={icon} size={14} color={toneColor} />
        </View>
        {trend ? (
          <TrendBadge
            direction={trend.direction}
            percentage={trend.percentage}
            size="sm"
          />
        ) : null}
      </View>

      <Text
        style={[styles.label, { color: colors.textMuted }]}
        numberOfLines={1}
      >
        {label}
      </Text>

      <AnimatedNumber
        value={value}
        format={formatValue}
        style={[styles.value, { color: colors.textPrimary }]}
      />

      {subtitle ? (
        <Text
          style={[styles.subtitle, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.small },
  value: {
    ...typography.price,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.tiny,
    marginTop: 2,
  },
});