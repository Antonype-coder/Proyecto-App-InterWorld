import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import type { Categoria } from '@tipos/index';

interface CategoriaChipProps {
  categoria: Categoria;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function CategoriaChip({
  categoria,
  onPress,
  style,
}: CategoriaChipProps): React.ReactElement {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colors.bgSubtle,
          borderColor: colors.border,
        },
        pressed && onPress ? { opacity: 0.7 } : null,
        style,
      ]}
      accessibilityRole="button"
    >
      <Text
        style={[styles.label, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {categoria.nombre}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: { ...typography.small },
});