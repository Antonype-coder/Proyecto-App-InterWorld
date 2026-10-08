import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, typography } from '@theme/index';
import type { NivelLealtad } from '@tipos/index';

interface LealtadBadgeProps {
  nivel: NivelLealtad;
  puntos?: number;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

interface NivelConfig {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bg: string;
}

/**
 * Mapa de niveles. Si tu backend agrega un nivel nuevo, cae al fallback
 * sin romper el type-check.
 */
const NIVEL_MAP: Record<string, NivelConfig> = {
  platino: {
    label: 'Platino',
    icon: 'diamond-stone',
    color: '#E5E4E2',
    bg: '#2F2F2F',
  },
  platinum: {
    label: 'Platino',
    icon: 'diamond-stone',
    color: '#E5E4E2',
    bg: '#2F2F2F',
  },
  oro: {
    label: 'Oro',
    icon: 'crown-outline',
    color: '#B45309',
    bg: '#FEF3C7',
  },
  gold: {
    label: 'Oro',
    icon: 'crown-outline',
    color: '#B45309',
    bg: '#FEF3C7',
  },
  plata: {
    label: 'Plata',
    icon: 'medal-outline',
    color: '#475569',
    bg: '#F1F5F9',
  },
  silver: {
    label: 'Plata',
    icon: 'medal-outline',
    color: '#475569',
    bg: '#F1F5F9',
  },
  bronce: {
    label: 'Bronce',
    icon: 'medal',
    color: '#7C2D12',
    bg: '#FEF3C7',
  },
  bronze: {
    label: 'Bronce',
    icon: 'medal',
    color: '#7C2D12',
    bg: '#FEF3C7',
  },
};

const FALLBACK: NivelConfig = {
  label: 'Cliente',
  icon: 'account-outline',
  color: '#475569',
  bg: '#F1F5F9',
};

export default function LealtadBadge({
  nivel,
  puntos,
  size = 'md',
  style,
}: LealtadBadgeProps): React.ReactElement {
  const isSmall = size === 'sm';
  const config = NIVEL_MAP[String(nivel)] ?? FALLBACK;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: config.bg,
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? 8 : 10,
          gap: isSmall ? 4 : 6,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={config.icon}
        size={isSmall ? 12 : 14}
        color={config.color}
      />
      <Text
        style={[
          styles.label,
          { color: config.color, fontSize: isSmall ? 10 : 12 },
        ]}
      >
        {config.label.toUpperCase()}
      </Text>
      {puntos !== undefined ? (
        <Text
          style={[
            styles.puntos,
            { color: config.color, fontSize: isSmall ? 10 : 12 },
          ]}
        >
          · {puntos}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: typography.button.fontFamily,
    letterSpacing: 0.4,
  },
  puntos: {
    fontFamily: typography.button.fontFamily,
  },
});