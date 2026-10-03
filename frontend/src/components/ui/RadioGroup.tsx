import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, spacing, typography } from '@theme/index';

interface RadioOption<T extends string> {
  label: string;
  value: T;
}

interface RadioGroupProps<T extends string> {
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: RadioGroupProps<T>): React.ReactElement {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={styles.row}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <View style={[styles.circle, selected ? styles.circleSelected : null]}>
              {selected ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.label}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelected: { borderColor: colors.primary },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  label: { ...typography.body, color: colors.textPrimary },
});