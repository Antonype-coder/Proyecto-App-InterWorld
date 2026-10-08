import React from 'react';
import { View, StyleSheet } from 'react-native';
import { radius, spacing } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Skeleton from './Skeleton';

export default function SkeletonKpi(): React.ReactElement {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Skeleton width="50%" height={10} />
      <Skeleton width="70%" height={24} style={{ marginTop: spacing.sm }} />
      <Skeleton width="60%" height={10} style={{ marginTop: spacing.xs }} />
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
});