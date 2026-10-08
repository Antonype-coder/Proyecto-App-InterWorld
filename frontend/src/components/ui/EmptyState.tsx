import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, typography, radius } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Button from './Button';

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export default function EmptyState({
  icon = 'inbox-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps): React.ReactElement {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[styles.iconWrap, { backgroundColor: colors.bgSubtle }]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={32}
          color={colors.textMuted}
        />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </Text>
      {description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  action: {
    marginTop: spacing.xl,
    minWidth: 180,
  },
});