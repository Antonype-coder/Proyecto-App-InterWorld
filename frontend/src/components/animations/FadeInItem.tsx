import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface FadeInItemProps {
  children: React.ReactNode;
  /** Delay en ms para efecto escalonado (típicamente index * 30). */
  delay?: number;
  duration?: number;
  /** Distancia de desplazamiento inicial en px. */
  offset?: number;
  style?: ViewStyle;
}

export default function FadeInItem({
  children,
  delay = 0,
  duration = 260,
  offset = 8,
  style,
}: FadeInItemProps): React.ReactElement {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}