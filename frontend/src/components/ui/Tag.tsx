import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '@theme/index';

interface TagProps {
  label: string;
  color?: string;
}

export default function Tag({
  label,
  color = colors.textSecondary,
}: TagProps): React.ReactElement {
  return (
    <View style={[styles.base, { borderColor: color }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.small,
    fontFamily: typography.button.fontFamily,
  },
});