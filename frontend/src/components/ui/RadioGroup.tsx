import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';

export interface RadioOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps<T extends string | number> {
  value: T | null;
  onChange: (value: T) => void;
  options: RadioOption<T>[];
  style?: ViewStyle;
}

export default function RadioGroup<T extends string | number>({
  value,
  onChange,
  options,
  style,
}: RadioGroupProps<T>): React.ReactElement {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
      accessibilityRole="radiogroup"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const isLast = index === options.length - 1;

        return (
          <Pressable
            key={String(option.value)}
            onPress={option.disabled ? undefined : () => onChange(option.value)}
            disabled={option.disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: option.disabled }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: colors.border },
              isLast ? styles.rowLast : null,
              pressed && !option.disabled
                ? { backgroundColor: colors.surfacePressed }
                : null,
              option.disabled ? styles.rowDisabled : null,
            ]}
          >
            <View
              style={[
                styles.dot,
                {
                  borderColor: selected ? colors.primary : colors.borderStrong,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              {selected ? (
                <View
                  style={[
                    styles.dotInner,
                    { backgroundColor: colors.primary },
                  ]}
                />
              ) : null}
            </View>

            <View style={styles.content}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {option.label}
              </Text>
              {option.description ? (
                <Text
                  style={[styles.description, { color: colors.textMuted }]}
                >
                  {option.description}
                </Text>
              ) : null}
            </View>

            {selected ? (
              <MaterialCommunityIcons
                name="check"
                size={16}
                color={colors.primary}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
    minHeight: 52,
  },
  rowLast: { borderBottomWidth: 0 },
  rowDisabled: { opacity: 0.4 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: { flex: 1 },
  label: { ...typography.body },
  description: {
    ...typography.small,
    marginTop: 2,
  },
});