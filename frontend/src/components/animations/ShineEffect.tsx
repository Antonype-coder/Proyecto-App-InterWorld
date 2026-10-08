import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useColors } from '@hooks/useColors';

interface ShineEffectProps {
  duration?: number;
  delay?: number;
  width?: number;
  children: React.ReactNode;
  borderRadius?: number;
}

export default function ShineEffect({
  duration = 1400,
  delay = 200,
  width = 120,
  children,
  borderRadius = 16,
}: ShineEffectProps): React.ReactElement {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(-width)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 9999,
          duration,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, duration, opacity, translateX, width]);

  // Color del "brillo" según tema
  const shineColor = colors.bg === '#F9FAFB'
    ? 'rgba(255, 255, 255, 0.85)'
    : 'rgba(255, 255, 255, 0.06)';

  return (
    <View style={[styles.container, { borderRadius }]}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shine,
          {
            width,
            backgroundColor: shineColor,
            opacity,
            transform: [
              { translateX },
              { rotate: '20deg' },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  shine: {
    position: 'absolute',
    top: -40,
    bottom: -40,
  },
});