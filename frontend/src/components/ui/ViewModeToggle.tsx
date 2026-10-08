import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { radius, spacing } from '@theme/index';
import { useColors } from '@hooks/useColors';
import type { CartViewMode } from '@hooks/useViewMode';

interface ViewModeToggleProps {
  mode: CartViewMode;
  onChange: (mode: CartViewMode) => void;
}

const OPTIONS: {
  value: CartViewMode;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}[] = [
  { value: 'compact', icon: 'format-list-text', label: 'Compacta' },
  { value: 'comfortable', icon: 'format-list-bulleted', label: 'Cómoda' },
  { value: 'detailed', icon: 'view-agenda-outline', label: 'Detallada' },
];

export default function ViewModeToggle({
  mode,
  onChange,
}: ViewModeToggleProps): React.ReactElement {
  const colors = useColors();

  const handlePress = (value: CartViewMode) => {
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
            accessibilityLabel={`Vista ${opt.label}`}
            accessibilityState={{ selected: active }}
            hitSlop={4}
          >
            <MaterialCommunityIcons
              name={opt.icon}
              size={14}
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
    width: 28,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});