import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Input from '../ui/Input';

interface FormNumberInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  required?: boolean;
  helper?: string;
  integer?: boolean;
}

export default function FormNumberInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = '0',
  icon,
  required,
  helper,
  integer = false,
}: FormNumberInputProps<T>): React.ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <Input
          label={label}
          placeholder={placeholder}
          keyboardType={integer ? 'number-pad' : 'decimal-pad'}
          icon={icon}
          required={required}
          helper={helper}
          value={value !== undefined && value !== null ? String(value) : ''}
          onChangeText={(text) => {
            const cleaned = integer
              ? text.replace(/[^0-9]/g, '')
              : text.replace(/[^0-9.,]/g, '').replace(',', '.');
            onChange(cleaned);
          }}
          onBlur={onBlur}
          error={error?.message}
        />
      )}
    />
  );
}