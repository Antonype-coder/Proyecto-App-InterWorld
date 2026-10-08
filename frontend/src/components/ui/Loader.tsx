import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '@theme/index';

interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export default function Loader({
  message,
  fullScreen = false,
  style,
}: LoaderProps): React.ReactElement {
  return (
    <View
      style={[
        fullScreen ? styles.fullScreen : styles.inline,
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Cargando'}
    >
      <ActivityIndicator size="small" color={colors.textSecondary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
  },
  inline: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});