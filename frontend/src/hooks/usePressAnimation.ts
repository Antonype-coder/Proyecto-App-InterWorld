import { useRef } from 'react';
import { Animated, PressableProps } from 'react-native';

interface UsePressAnimationOptions {
  scaleTo?: number;
  opacityTo?: number;
  duration?: number;
  enable?: boolean;
}

/**
 * Devuelve un estilo animado y handlers para un Pressable.
 *
 * Uso:
 *   const press = usePressAnimation();
 *   <Animated.View style={press.style}>
 *     <Pressable onPressIn={press.onPressIn} onPressOut={press.onPressOut} />
 *   </Animated.View>
 */
export function usePressAnimation({
  scaleTo = 0.97,
  opacityTo = 0.85,
  duration = 120,
  enable = true,
}: UsePressAnimationOptions = {}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (!enable) return;
    Animated.parallel([
      Animated.timing(scale, {
        toValue: scaleTo,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: opacityTo,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onPressOut = () => {
    if (!enable) return;
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: duration + 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration + 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const style = {
    transform: [{ scale }],
    opacity,
  };

  return { style, onPressIn, onPressOut };
}

export type PressHandlers = Pick<PressableProps, 'onPressIn' | 'onPressOut'>;