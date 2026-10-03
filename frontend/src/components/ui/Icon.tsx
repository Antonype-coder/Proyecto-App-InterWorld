import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@theme/index';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export default function Icon({
  name,
  size = 20,
  color = colors.textPrimary,
}: IconProps): React.ReactElement {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export type { IconName };