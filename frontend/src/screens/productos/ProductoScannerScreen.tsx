import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '@theme/index';
import { buscarEnCatalogosPublicos, productosApi } from '@api/index';
import type { FuenteCatalogoPublico } from '@api/catalogos-publicos.api';

const BARCODE_TYPES = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'itf14',
] as const;

const normalizeBarcode = (value: string): string =>
  String(value ?? '').replace(/\s+/g, '').trim();

const esCodigoValido = (value: string): boolean => {
  const normalized = normalizeBarcode(value);
  if (!normalized) return false;
  if (/^[a-z]+:\/\//i.test(normalized)) return false;
  if (normalized.includes('exp.host')) return false;
  if (normalized.includes(':8081')) return false;
  if (/\s/.test(normalized)) return false;
  if (/^\d{8,14}$/.test(normalized)) return true;
  if (/^[A-Za-z0-9\-._$/+%]{4,48}$/.test(normalized)) return true;
  return false;
};

export default function ProductoScannerScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [origen, setOrigen] = useState<'pos' | 'formulario'>('formulario');
  const scannerLockRef = useRef(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const resetScannerState = useCallback(() => {
    scannerLockRef.current = false;
    setScanned(false);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const nuevoOrigen = route.params?.origen;
      if (nuevoOrigen === 'pos' || nuevoOrigen === 'formulario') {
        setOrigen(nuevoOrigen);
      }
      resetScannerState();
      setCameraError(null);
    }, [route.params?.origen, resetScannerState]),
  );

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const abrirAjustes = (): void => {
    Linking.openSettings().catch(() => {
      Alert.alert(
        'Ajustes',
        'Abre manualmente: Ajustes → Expo Go → Cámara → Permitir',
      );
    });
  };

  const cerrar = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (origen === 'formulario' && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate(origen === 'formulario' ? 'Productos' : 'Vender');
  };

  const handleBarCodeScanned = useCallback(
    async ({ data, type }: { type: string; data: string }): Promise<void> => {
      const normalized = normalizeBarcode(data);

      if (!normalized) {
        resetScannerState();
        return;
      }

      // Ignorar URLs y QRs de Expo
      if (
        /^[a-z]+:\/\//i.test(normalized) ||
        normalized.includes('exp.host') ||
        normalized.includes(':8081')
      ) {
        return;
      }

      if (scannerLockRef.current || scanned || loading) return;

      if (!esCodigoValido(normalized)) {
        resetScannerState();
        return;
      }

      scannerLockRef.current = true;
      setScanned(true);
      setLoading(true);

      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

        // ────────── Modo FORMULARIO ──────────
        if (origen === 'formulario') {
          navigation.navigate('Productos', {
            screen: 'ProductoForm',
            params: { codigoEscaneado: normalized },
          });
          return;
        }

        // ══════════════════════════════════════
        // MODO POS — SOLO buscar producto y agregar al carrito
        // ══════════════════════════════════════

        let productoLocal = null;
        try {
          productoLocal = await productosApi.buscarPorCodigo(normalized);
        } catch {
          productoLocal = null;
        }

        if (productoLocal) {
          // ✅ Encontrado → agregar al carrito
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          navigation.navigate('Vender', {
            productoEscaneado: productoLocal,
          });
          return;
        }

        // ❌ No encontrado → mensaje simple y seguir escaneando
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        );

        Alert.alert(
          'Producto no encontrado',
          `El código ${normalized} no está registrado en tu catálogo.`,
          [
            {
              text: 'Escanear otro',
              onPress: resetScannerState,
              style: 'default',
            },
            {
              text: 'Salir',
              style: 'cancel',
              onPress: cerrar,
            },
          ],
        );
      } catch (error) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        );
        const msg =
          error instanceof Error
            ? error.message
            : 'Error al buscar el producto';
        Alert.alert('Error', msg, [
          { text: 'OK', onPress: resetScannerState },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      cerrar,
      loading,
      navigation,
      origen,
      resetScannerState,
      scanned,
    ],
  );

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={styles.loadingText}>Cargando cámara...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.headerNormal}>
          <Pressable onPress={cerrar} hitSlop={20} style={styles.backBtnNormal}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>
          <Text style={styles.headerTitleNormal}>Escanear código</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.center}>
          <MaterialCommunityIcons
            name="camera-off-outline"
            size={64}
            color={colors.warning}
            style={{ marginBottom: 16 }}
          />
          <Text style={styles.title}>Permiso denegado</Text>
          <Text style={styles.desc}>
            Activa la cámara en Ajustes → Expo Go → Cámara.
          </Text>
          <Pressable onPress={abrirAjustes} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Abrir Ajustes</Text>
          </Pressable>
          <Pressable onPress={requestPermission} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Reintentar</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        onMountError={(error) => {
          setCameraError(error?.message || 'Error al iniciar cámara');
        }}
        barcodeScannerSettings={{
          barcodeTypes: [...BARCODE_TYPES],
        }}
      />

      <SafeAreaView
        style={styles.headerOverlay}
        edges={['top']}
        pointerEvents="box-none"
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={cerrar}
            hitSlop={20}
            style={styles.backBtnGlass}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitleGlass}>Escanear código</Text>
            <Text style={styles.headerModeGlass}>
              {origen === 'pos' ? 'Modo Venta' : 'Modo Producto'}
            </Text>
          </View>

          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <View style={styles.middleOverlay} pointerEvents="none">
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {loading ? (
          <View style={styles.badge}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.badgeText}>Buscando producto...</Text>
          </View>
        ) : cameraError ? (
          <View style={[styles.badge, styles.badgeError]}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color="#FFF"
            />
            <Text style={styles.badgeText}>{cameraError}</Text>
          </View>
        ) : (
          <Text style={styles.hint}>Apunta al código de barras</Text>
        )}
      </View>

      <SafeAreaView
        style={styles.footerOverlay}
        edges={['bottom']}
        pointerEvents="none"
      >
        <View style={styles.footer}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color="#FFF"
          />
          <Text style={styles.footerText}>
            {origen === 'formulario'
              ? 'El código se colocará en el formulario del producto.'
              : 'El producto se agregará al carrito automáticamente.'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1, backgroundColor: colors.bg },

  headerNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtnNormal: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleNormal: { ...typography.h3, color: colors.textPrimary },

  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  backBtnGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 11,
    elevation: 11,
  },
  headerTitleGlass: {
    ...typography.h3,
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerModeGlass: {
    color: '#FFF',
    fontSize: 11,
    opacity: 0.85,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  middleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 280,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 16,
  },
  hint: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  badgeError: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    maxWidth: 300,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  footerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  footerText: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    lineHeight: 16,
  },

  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  desc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
  secondaryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 200,
    alignItems: 'center',
  },
  secondaryBtnText: {
    ...typography.buttonSmall,
    color: colors.textPrimary,
  },
});   