import React from 'react';
import type { ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Input from '@components/ui/Input';
import { formatNumericInput, parseNumericInput } from '@utils/format';

interface FormattedNumberInputProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  integer?: boolean;
  placeholder?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  required?: boolean;
  helper?: string;
  containerStyle?: ViewStyle;
}

export default function FormattedNumberInput({
  label,
  value,
  onChangeText,
  integer = false,
  placeholder,
  icon,
  required,
  helper,
  containerStyle,
}: FormattedNumberInputProps): React.ReactElement {
  return (
    <Input
      label={label}
      placeholder={placeholder}
      keyboardType={integer ? 'number-pad' : 'decimal-pad'}
      icon={icon}
      required={required}
      helper={helper}
      containerStyle={containerStyle}
      value={formatNumericInput(value, integer)}
      onChangeText={(text) => onChangeText(parseNumericInput(text, integer))}
    />
  );
}
