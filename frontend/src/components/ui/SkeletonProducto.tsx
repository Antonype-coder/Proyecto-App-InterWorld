import React from 'react';
import { View, StyleSheet } from 'react-native';
import { radius, spacing } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Skeleton from './Skeleton';

export default function SkeletonProducto(): React.ReactElement {
  const colors = useColors();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Skeleton width={40} height={40} borderRadius={radius.md} />
      <View style={styles.info}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={60} height={14} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  info: { flex: 1 },
});