import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, shadows } from '@theme/index';

interface FABProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
  color?: string;
}

export default function FAB({
  icon = 'plus',
  onPress,
  accessibilityLabel = 'Acción',
  style,
  color = colors.primary,
}: FABProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: color },
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={colors.textInverse}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  pressed: { opacity: 0.85 },
});