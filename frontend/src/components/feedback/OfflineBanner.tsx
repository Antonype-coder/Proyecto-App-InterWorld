import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useNetworkStatus } from '@hooks/useNetworkStatus';

interface OfflineBannerProps {
  onRetry?: () => void;
}

export default function OfflineBanner({
  onRetry,
}: OfflineBannerProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isOnline = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const visible = isOnline === false;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: visible ? 0 : -60,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateY, opacity]);

  if (isOnline === null) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.container,
        {
          top: insets.top,
          backgroundColor: colors.warningSubtle,
          borderBottomColor: colors.warning,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <MaterialCommunityIcons
        name="wifi-off"
        size={16}
        color={colors.warning}
      />
      <Text style={[styles.text, { color: colors.warningText }]}>
        Sin conexión. Los cambios se guardarán localmente.
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Reintentar conexión"
        >
          <Text style={[styles.action, { color: colors.warningText }]}>
            Reintentar
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    zIndex: 100,
  },
  text: {
    ...typography.small,
    flex: 1,
  },
  action: {
    ...typography.buttonSmall,
  },
});