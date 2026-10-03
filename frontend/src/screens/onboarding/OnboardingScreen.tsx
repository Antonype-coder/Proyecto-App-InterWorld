import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, radius, spacing, typography } from '@theme/index';
import Button from '@components/ui/Button';
import ProgressDots from '@components/ui/ProgressDots';

const SLIDES = [
  {
    icon: 'storefront-outline' as const,
    title: 'Bienvenido a Interworld',
    description:
      'Administra tu tienda desde cualquier lugar. Ventas, inventario, clientes y más, en una sola app.',
  },
  {
    icon: 'cart-outline' as const,
    title: 'Vende rápido',
    description:
      'Registra ventas en segundos, acepta pagos de contado o a crédito y controla tu stock automáticamente.',
  },
  {
    icon: 'chart-line' as const,
    title: 'Toma mejores decisiones',
    description:
      'Consulta reportes en tiempo real: productos más vendidos, cartera de clientes y utilidades.',
  },
];

interface OnboardingScreenProps {
  onFinish: () => void;
}

export const ONBOARDING_KEY = '@tiendaadmin:onboarding_completed';

export default function OnboardingScreen({
  onFinish,
}: OnboardingScreenProps): React.ReactElement {
  const [current, setCurrent] = useState(0);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const next = (): void => {
    if (isLast) {
      void finish();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const finish = async (): Promise<void> => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    onFinish();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Skip */}
        <View style={styles.header}>
          {!isLast ? (
            <Pressable onPress={finish} hitSlop={10}>
              <Text style={styles.skip}>Saltar</Text>
            </Pressable>
          ) : (
            <View />
          )}
        </View>

        {/* Slide */}
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={slide.icon}
              size={64}
              color={colors.textPrimary}
            />
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ProgressDots total={SLIDES.length} current={current} />
          <View style={styles.cta}>
            <Button
              label={isLast ? 'Empezar' : 'Siguiente'}
              onPress={next}
              variant="primary"
              size="lg"
              fullWidth
              icon={isLast ? 'check' : 'arrow-right'}
              iconPosition="right"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: spacing.xxl },
  header: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skip: {
    ...typography.buttonSmall,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  footer: {
    paddingBottom: spacing.xxl,
    gap: spacing.xxl,
  },
  cta: { width: '100%' },
});