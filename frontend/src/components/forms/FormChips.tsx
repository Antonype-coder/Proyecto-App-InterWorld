import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import Chip from '../ui/Chip';
import { spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface ChipOption {
  label: string;
  value: string | number;
}

interface FormChipsProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  options: ChipOption[];
  required?: boolean;
}

export default function FormChips<T extends FieldValues>({
  control,
  name,
  label,
  options,
  required,
}: FormChipsProps<T>): React.ReactElement {
  const colors = useColors();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <View style={styles.container}>
          {label ? (
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {label}
              </Text>
              {required ? (
                <Text style={[styles.required, { color: colors.danger }]}>
                  *
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.chips}>
            {options.map((opt) => (
              <Chip
                key={String(opt.value)}
                label={opt.label}
                active={value === opt.value}
                onPress={() => onChange(opt.value)}
              />
            ))}
          </View>

          {error?.message ? (
            <Text style={[styles.error, { color: colors.danger }]}>
              {error.message}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: { ...typography.bodyBold },
  required: {
    ...typography.bodyBold,
    marginLeft: 3,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { ...typography.small, marginTop: spacing.sm },
});