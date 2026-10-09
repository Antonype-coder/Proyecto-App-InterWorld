import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { spacing, radius, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface OnboardingStep {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

interface OnboardingBannerProps {
  onConfigurar: () => void;
  onCrearCategoria: () => void;
  onCrearProducto: () => void;
  onVender: () => void;
}

export default function OnboardingBanner({
  onConfigurar,
  onCrearCategoria,
  onCrearProducto,
  onVender,
}: OnboardingBannerProps): React.ReactElement | null {
  const colors = useColors();
  const [cerrado, setCerrado] = useState(false);

  if (cerrado) return null;

  const steps: OnboardingStep[] = [
    {
      icon: 'storefront-outline',
      title: 'Configura tu negocio',
      subtitle: 'Logo, nombre, teléfono',
      onPress: onConfigurar,
    },
    {
      icon: 'shape-outline',
      title: 'Crea una categoría',
      subtitle: 'Organiza tus productos',
      onPress: onCrearCategoria,
    },
    {
      icon: 'package-variant-plus',
      title: 'Agrega tu primer producto',
      subtitle: 'Con foto y precio',
      onPress: onCrearProducto,
    },
    {
      icon: 'cart-plus',
      title: 'Haz tu primera venta',
      subtitle: 'Prueba el punto de venta',
      onPress: onVender,
    },
  ];

  const ejecutar = (fn: () => void) => {
    void Haptics.selectionAsync();
    fn();
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons
            name="rocket-launch-outline"
            size={14}
            color={colors.textInverse}
          />
          <Text style={[styles.badgeText, { color: colors.textInverse }]}>
            EMPIEZA AQUÍ
          </Text>
        </View>

        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            setCerrado(true);
          }}
          hitSlop={12}
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Prepara tu tienda en 4 pasos
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Sigue esta guía y en minutos estarás vendiendo.
      </Text>

      <View style={styles.steps}>
        {steps.map((step, idx) => (
          <Pressable
            key={step.title}
            onPress={() => ejecutar(step.onPress)}
            style={({ pressed }) => [
              styles.step,
              {
                backgroundColor: colors.bgSubtle,
                borderColor: colors.border,
              },
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <View
              style={[styles.stepNumber, { backgroundColor: colors.primary }]}
            >
              <Text
                style={[styles.stepNumberText, { color: colors.textInverse }]}
              >
                {idx + 1}
              </Text>
            </View>

            <View
              style={[styles.stepIcon, { backgroundColor: colors.surface }]}
            >
              <MaterialCommunityIcons
                name={step.icon}
                size={18}
                color={colors.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={[styles.stepTitle, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {step.title}
              </Text>
              <Text
                style={[styles.stepSubtitle, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {step.subtitle}
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: {
    ...typography.overline,
    fontSize: 10,
  },
  title: {
    ...typography.h3,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  steps: {
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...typography.small,
    fontWeight: '700',
  },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    ...typography.bodyBold,
  },
  stepSubtitle: {
    ...typography.small,
    marginTop: 1,
  },
});