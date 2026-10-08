import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { radius } from '@theme/index';
import { useColors } from '@hooks/useColors';
import type { ProductViewMode } from '@hooks/useProductViewMode';

interface ProductViewToggleProps {
  mode: ProductViewMode;
  onChange: (mode: ProductViewMode) => void;
}

const OPTIONS: {
  value: ProductViewMode;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}[] = [
  { value: 'grid', icon: 'view-grid-outline', label: 'Cuadrícula' },
  { value: 'list', icon: 'format-list-bulleted', label: 'Lista' },
  { value: 'compact', icon: 'format-list-text', label: 'Compacta' },
];

export default function ProductViewToggle({
  mode,
  onChange,
}: ProductViewToggleProps): React.ReactElement {
  const colors = useColors();

  const handlePress = (value: ProductViewMode) => {
    if (value === mode) return;
    void Haptics.selectionAsync();
    onChange(value);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSubtle,
          borderColor: colors.border,
        },
      ]}
    >
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => handlePress(opt.value)}
            style={({ pressed }) => [
              styles.option,
              active ? { backgroundColor: colors.surface } : null,
              pressed && !active ? { opacity: 0.7 } : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${opt.label}`}
            accessibilityState={{ selected: active }}
            hitSlop={4}
          >
            <MaterialCommunityIcons
              name={opt.icon}
              size={16}
              color={active ? colors.textPrimary : colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  option: {
    width: 32,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});