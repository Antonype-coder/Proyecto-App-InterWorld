import React from 'react';
import { Switch as RNSwitch, SwitchProps } from 'react-native';
import { colors } from '@theme/index';

export default function Switch({
  value,
  onValueChange,
  ...rest
}: SwitchProps): React.ReactElement {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: colors.primary, false: colors.border }}
      thumbColor={colors.surface}
      {...rest}
    />
  );
}