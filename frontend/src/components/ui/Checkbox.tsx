import React from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Checkbox({
  checked,
  onToggle,
  label,
  disabled = false,
  style,
}: CheckboxProps): React.ReactElement {
  const colors = useColors();

  return (
    <Pressable
      onPress={disabled ? undefined : onToggle}
      style={[
        styles.container,
        disabled ? styles.disabled : null,
        style,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? colors.primary : colors.borderStrong,
            backgroundColor: checked ? colors.primary : colors.surface,
          },
        ]}
      >
        {checked ? (
          <MaterialCommunityIcons
            name="check"
            size={14}
            color={colors.textInverse}
          />
        ) : null}
      </View>
      {label ? (
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.body },
  disabled: { opacity: 0.5 },
});