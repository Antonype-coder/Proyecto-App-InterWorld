import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface StaggeredSectionProps {
  children: React.ReactNode;
  /** Retraso en ms. Típicamente index * 80. */
  delay?: number;
  /** Distancia de desplazamiento inicial. */
  offset?: number;
  duration?: number;
  style?: ViewStyle;
}

export default function StaggeredSection({
  children,
  delay = 0,
  offset = 24,
  duration = 420,
  style,
}: StaggeredSectionProps): React.ReactElement {
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