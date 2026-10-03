import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@theme/index';

interface OfflineBannerProps {
  visible: boolean;
}

export default function OfflineBanner({
  visible,
}: OfflineBannerProps): React.ReactElement | null {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="wifi-off"
        size={16}
        color={colors.warningText}
      />
      <Text style={styles.text}>Sin conexión a internet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.warningSubtle,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning,
  },
  text: { ...typography.small, color: colors.warningText },
});