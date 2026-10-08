import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface DividerProps {
  vertical?: boolean;
  spacingVertical?: number;
  style?: ViewStyle;
}

export default function Divider({
  vertical = false,
  spacingVertical: sp = spacing.md,
  style,
}: DividerProps): React.ReactElement {
  const colors = useColors();

  if (vertical) {
    return (
      <View
        style={[
          {
            width: 1,
            backgroundColor: colors.border,
            alignSelf: 'stretch',
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: colors.border,
          marginVertical: sp,
        },
        style,
      ]}
    />
  );
}