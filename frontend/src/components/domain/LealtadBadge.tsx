import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@theme/index';
import type { NivelLealtad } from '@tipos/index';

interface Props {
  nivel: NivelLealtad;
  size?: 'sm' | 'md';
}

const NIVEL_CONFIG: Record<NivelLealtad, {
  label: string;
  bg: string;
  text: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}> = {
  bronze: { label: 'Bronze', bg: '#FED7AA', text: '#9A3412', icon: 'medal-outline' },
  silver: { label: 'Silver', bg: '#E5E7EB', text: '#4B5563', icon: 'medal' },
  gold:   { label: 'Gold',   bg: '#FEF3C7', text: '#92400E', icon: 'crown' },
};

export default function LealtadBadge({ nivel, size = 'md' }: Props): React.ReactElement {
  const cfg = NIVEL_CONFIG[nivel];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: cfg.bg, paddingVertical: isSmall ? 2 : 3, paddingHorizontal: isSmall ? 6 : 8 },
      ]}
    >
      <MaterialCommunityIcons name={cfg.icon} size={isSmall ? 10 : 12} color={cfg.text} style={{ marginRight: 3 }} />
      <Text style={[styles.label, { color: cfg.text, fontSize: isSmall ? 10 : 11 }]}>
        {cfg.label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xs, alignSelf: 'flex-start' },
  label: { fontFamily: typography.button.fontFamily, letterSpacing: 0.4 },
});