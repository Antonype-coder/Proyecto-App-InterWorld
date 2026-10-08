import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface LoaderProps {
  message?: string;
}

export default function Loader({
  message = 'Cargando…',
}: LoaderProps): React.ReactElement {
  const colors = useColors();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.bg }]}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <ActivityIndicator size="large" color={colors.textSecondary} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  message: {
    ...typography.body,
  },
});