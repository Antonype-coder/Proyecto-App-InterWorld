import React from 'react';
import { Pressable, StyleSheet, ViewStyle, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, shadows } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { usePressAnimation } from '@hooks/usePressAnimation';

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
  color,
}: FABProps): React.ReactElement {
  const colors = useColors();
  const bg = color ?? colors.primary;
  const press = usePressAnimation({ scaleTo: 0.92, opacityTo: 0.9 });

  return (
    <Animated.View style={[styles.wrapper, press.style, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[styles.base, { backgroundColor: bg }, shadows.lg]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={colors.textInverse}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  base: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});