import React from 'react';
import { View, StyleSheet } from 'react-native';
import { radius, spacing } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Skeleton from './Skeleton';

export default function SkeletonVenta(): React.ReactElement {
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
      <View style={styles.left}>
        <Skeleton width="50%" height={14} />
        <Skeleton width="70%" height={12} style={{ marginTop: 6 }} />
        <Skeleton width="40%" height={10} style={{ marginTop: 6 }} />
      </View>
      <View style={styles.right}>
        <Skeleton width={80} height={14} />
        <Skeleton
          width={60}
          height={16}
          borderRadius={radius.xs}
          style={{ marginTop: 6 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  left: { flex: 1 },
  right: { alignItems: 'flex-end' },
});