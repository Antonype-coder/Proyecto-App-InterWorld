import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@theme/index';
import BusinessLogo from '@components/domain/BusinessLogo';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onRightPress?: () => void;
  rightLabel?: string;
}

export default function TopBar({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  rightLabel,
}: TopBarProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={colors.textPrimary}
          />
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <BusinessLogo size={24} />
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightIcon && onRightPress ? (
        <Pressable
          onPress={onRightPress}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={rightLabel ?? 'Acción'}
        >
          {rightLabel ? (
            <Text style={styles.rightLabel}>{rightLabel}</Text>
          ) : (
            <MaterialCommunityIcons
              name={rightIcon}
              size={20}
              color={colors.textPrimary}
            />
          )}
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    minWidth: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, alignItems: 'center', minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, maxWidth: '100%' },
  title: { ...typography.h3, color: colors.textPrimary },
  subtitle: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  rightLabel: {
    ...typography.buttonSmall,
    color: colors.textPrimary,
  },
});