import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, typography, radius } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Button from './Button';

interface RichEmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  style?: ViewStyle;
}

export default function RichEmptyState({
  icon = 'inbox-outline',
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  style,
}: RichEmptyStateProps): React.ReactElement {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={40}
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
        <View style={styles.actions}>
          <Button
            label={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
            fullWidth
          />
          {secondaryLabel && onSecondary ? (
            <Button
              label={secondaryLabel}
              onPress={onSecondary}
              variant="ghost"
              size="md"
              fullWidth
            />
          ) : null}
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
    paddingVertical: spacing.giant,
    paddingHorizontal: spacing.xxl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  actions: {
    marginTop: spacing.xxl,
    width: '100%',
    maxWidth: 280,
    gap: spacing.sm,
  },
});