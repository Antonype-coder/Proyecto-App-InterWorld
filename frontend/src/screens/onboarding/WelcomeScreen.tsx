import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Button from '@components/ui/Button';
import { STORAGE_ONBOARDING_KEY } from '@utils/constants';
import { useAuthStore } from '@store/authStore';

const { width } = Dimensions.get('window');

interface Slide {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  color: string;
}

interface WelcomeScreenProps {
  onFinish: () => void;
}

export default function WelcomeScreen({
  onFinish,
}: WelcomeScreenProps): React.ReactElement {
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [saliendo, setSaliendo] = useState(false);

  const slides: Slide[] = [
    {
      icon: 'storefront-outline',
      title: `¡Bienvenido, ${user?.nombre?.split(' ')[0] ?? 'amigo'}!`,
      description:
        'Tu tienda está lista para configurarse. Gestiona productos, ventas, clientes y todo tu negocio desde un solo lugar.',
      color: colors.primary,
    },
    {
      icon: 'package-variant-plus',
      title: 'Agrega tus productos',
      description:
        'Crea categorías y agrega productos con foto, precio y stock. Escanea códigos de barras para hacerlo más rápido.',
      color: colors.info,
    },
    {
      icon: 'cart-plus',
      title: 'Vende en segundos',
      description:
        'Usa el Punto de Venta para cobrar rápido. Acepta efectivo, tarjeta o crédito y lleva control de tu caja.',
      color: colors.success,
    },
    {
      icon: 'chart-line',
      title: 'Toma decisiones con datos',
      description:
        'Consulta reportes de ventas, productos más vendidos y utilidades. Todo en tiempo real.',
      color: colors.warning,
    },
  ];

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setPage(index);
  };

  const terminar = async () => {
    if (saliendo) return;
    setSaliendo(true);

    try {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch {
      // Ignorar si el dispositivo no soporta haptics
    }

    await AsyncStorage.removeItem(STORAGE_ONBOARDING_KEY);

    // Avisa al padre para que cambie a AppTabs sin volver al welcome
    onFinish();
  };

  const esUltimo = page === slides.length - 1;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.skipRow}>
        {!esUltimo ? (
          <Pressable onPress={terminar} hitSlop={12} disabled={saliendo}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>
              Omitir
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!saliendo}
        onMomentumScrollEnd={(e) =>
          setPage(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      >
        {slides.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${slide.color}18` },
              ]}
            >
              <MaterialCommunityIcons
                name={slide.icon}
                size={72}
                color={slide.color}
              />
            </View>

            <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>
              {slide.title}
            </Text>

            <Text
              style={[styles.slideDesc, { color: colors.textSecondary }]}
            >
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => goTo(i)}
            hitSlop={8}
            disabled={saliendo}
            style={[
              styles.dot,
              { backgroundColor: colors.border },
              i === page
                ? [styles.dotActive, { backgroundColor: colors.primary }]
                : null,
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        {esUltimo ? (
          <Button
            label="Comenzar a configurar"
            onPress={() => {
              void terminar();
            }}
            loading={saliendo}
            disabled={saliendo}
            variant="primary"
            size="lg"
            fullWidth
          />
        ) : (
          <Button
            label="Siguiente"
            onPress={() => goTo(page + 1)}
            variant="primary"
            size="lg"
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    height: 40,
  },
  skipText: { ...typography.caption },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },

  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.giant,
  },

  slideTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  slideDesc: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 340,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },

  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
  },
});