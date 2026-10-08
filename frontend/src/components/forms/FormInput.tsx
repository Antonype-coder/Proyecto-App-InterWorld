import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Input from '../ui/Input';

interface FormInputProps<T extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  required?: boolean;
  helper?: string;
}

export default function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  icon,
  required,
  helper,
  ...rest
}: FormInputProps<T>): React.ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <Input
          {...rest}
          label={label}
          icon={icon}
          required={required}
          helper={helper}
          value={value !== undefined && value !== null ? String(value) : ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
        />
      )}
    />
  );
}