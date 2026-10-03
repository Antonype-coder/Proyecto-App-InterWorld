import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@theme/index';

interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loader({
  message,
  fullScreen = true,
}: LoaderProps): React.ReactElement {
  return (
    <View style={[styles.container, fullScreen ? styles.fullScreen : null]}>
      <ActivityIndicator size="small" color={colors.textSecondary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  fullScreen: { flex: 1 },
  message: { ...typography.caption, color: colors.textMuted },
});