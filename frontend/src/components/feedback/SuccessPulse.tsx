import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography, shadows } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface SuccessPulseProps {
  visible: boolean;
  label?: string;
}

export default function SuccessPulse({
  visible,
  label,
}: SuccessPulseProps): React.ReactElement | null {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.6);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 12,
          stiffness: 220,
          mass: 0.6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacity, scale]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { opacity }]}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            transform: [{ scale }],
          },
          shadows.xl,
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.successSubtle },
          ]}
        >
          <MaterialCommunityIcons
            name="check"
            size={32}
            color={colors.success}
          />
        </View>
        {label ? (
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {label}
          </Text>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9000,
  },
  card: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 140,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodyBold,
  },
});