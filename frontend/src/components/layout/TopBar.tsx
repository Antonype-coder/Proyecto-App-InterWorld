import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import BusinessLogo from '@components/domain/BusinessLogo';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onRightPress?: () => void;
  rightLabel?: string;
}

export default function TopBar({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  rightLabel,
}: TopBarProps): React.ReactElement {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {onBack ? (
        <AnimatedIconButton
          icon="arrow-left"
          onPress={onBack}
          accessibilityLabel="Volver"
          color={colors.textPrimary}
        />
      ) : (
        <View style={styles.iconBtn} />
      )}

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <BusinessLogo size={24} />
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightIcon && onRightPress ? (
        <AnimatedIconButton
          icon={rightIcon}
          onPress={onRightPress}
          accessibilityLabel={rightLabel ?? 'Acción'}
          color={colors.textPrimary}
          label={rightLabel}
        />
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

function AnimatedIconButton({
  icon,
  onPress,
  accessibilityLabel,
  color,
  label,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  color: string;
  label?: string;
}): React.ReactElement {
  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        hitSlop={10}
        style={styles.iconBtn}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {label ? (
          <Text style={[styles.rightLabel, { color }]}>{label}</Text>
        ) : (
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  iconBtn: {
    minWidth: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, alignItems: 'center', minWidth: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    maxWidth: '100%',
  },
  title: { ...typography.h3 },
  subtitle: { ...typography.small, marginTop: 2 },
  rightLabel: {
    ...typography.buttonSmall,
  },
});