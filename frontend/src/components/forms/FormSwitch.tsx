import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import Switch from '../ui/Switch';
import { colors, spacing, typography } from '@theme/index';

interface FormSwitchProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  helper?: string;
}

export default function FormSwitch<T extends FieldValues>({
  control,
  name,
  label,
  helper,
}: FormSwitchProps<T>): React.ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.label}>{label}</Text>
            {helper ? <Text style={styles.helper}>{helper}</Text> : null}
          </View>
          <Switch value={Boolean(value)} onValueChange={onChange} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  info: { flex: 1 },
  label: { ...typography.bodyBold, color: colors.textPrimary },
  helper: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});