// src/screens/ventas/ProductoScannerScreen.tsx
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
  'qr',
] as const;

const normalizeBarcode = (value: string): string =>
  String(value ?? '').replace(/\s+/g, '').trim();

const isValidBarcode = (value: string): boolean => {
  const normalized = normalizeBarcode(value);
  return /^\d{8,13}$/.test(normalized) || normalized.length > 0;
};

export default function ProductoScannerScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const origen: 'pos' | 'formulario' = route.params?.origen ?? 'formulario';
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
      resetScannerState();
      setCameraError(null);
    }, [resetScannerState]),
  );

  useEffect(() => {
    console.log('[SCANNER] Estado permiso:', {
      granted: permission?.granted,
      canAskAgain: permission?.canAskAgain,
      status: permission?.status,
    });

    if (permission && !permission.granted && permission.canAskAgain) {
      console.log('[SCANNER] Solicitando permiso de cámara...');
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (origen === 'formulario') {
      navigation.navigate('Productos');
    } else {
      navigation.goBack();
    }
  };

  const buscarProductoEscaneado = useCallback(
    async (codigo: string): Promise<{ source: 'local' | FuenteCatalogoPublico; producto?: unknown } | null> => {
      const normalized = normalizeBarcode(codigo);

      try {
        const producto = await productosApi.buscarPorCodigo(normalized);
        return { source: 'local', producto };
      } catch {
        // Continue with the public catalogs when the local catalog has no match.
      }

      const publicResult = await buscarEnCatalogosPublicos(normalized);
      return publicResult
        ? { source: publicResult.source, producto: publicResult.producto }
        : null;
    },
    [],
  );

  const handleBarCodeScanned = useCallback(
    async ({ data, type }: { type: string; data: string }): Promise<void> => {
      const normalized = normalizeBarcode(data);

      if (!normalized) {
        console.warn('[SCANNER] Código vacío detectado');
        Alert.alert('Código no detectado', 'No se pudo leer ningún valor desde la cámara.' );
        return;
      }

      console.log('[SCANNER] Código detectado:', normalized, 'Tipo:', type);

      if (scannerLockRef.current || scanned || loading) {
        console.log('[SCANNER] Escaneo bloqueado. Duplicado o en procesamiento');
        return;
      }

      if (!isValidBarcode(normalized)) {
        console.warn('[SCANNER] Código inválido:', normalized);
        Alert.alert('Código inválido', 'El valor escaneado no parece un código de barras válido.');
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

        if (origen === 'formulario') {
          console.log('[SCANNER] Redirigiendo a formulario con código:', normalized);
          navigation.navigate('Productos', {
            screen: 'ProductoForm',
            params: { codigoEscaneado: normalized },
          });
          return;
        }

        const resultado = await buscarProductoEscaneado(normalized);

        if (resultado?.source === 'local' && resultado.producto) {
          console.log('[SCANNER] Producto encontrado en backend, navegando al POS');
          navigation.navigate('Vender', {
            productoEscaneado: resultado.producto,
          });
          return;
        }

        if (origen === 'pos') {
          console.warn('[SCANNER] Producto no registrado para la venta:', normalized);
          Alert.alert(
            'Producto no disponible para la venta',
            `El código ${normalized} no está registrado en el sistema y no se cargará en el carrito.`,
            [{ text: 'Escanear otro', onPress: resetScannerState }],
          );
          return;
        }

        if (resultado && resultado.source !== 'local' && resultado.producto) {
          const productoInfo = resultado.producto as {
            code?: string | null;
            product_name?: string | null;
            brands?: string | null;
            categories?: string | null;
            ingredients_text?: string | null;
            image_front_url?: string | null;
            image_url?: string | null;
          };

          const nombre =
            productoInfo.product_name ?? 'Producto identificado';
          const marca = productoInfo.brands ?? 'Sin marca';
          const categoria = productoInfo.categories ?? 'Sin categoría';
          const descripcion =
            productoInfo.ingredients_text ?? 'Sin descripción disponible';
          const imagen =
            productoInfo.image_front_url ?? productoInfo.image_url ?? null;

          const detalle = [
            `Nombre: ${nombre}`,
            `Marca: ${marca}`,
            `Categoría: ${categoria}`,
            `Descripción: ${descripcion}`,
            `Código: ${productoInfo.code ?? normalized}`,
            imagen ? `Imagen: ${imagen}` : null,
          ]
            .filter(Boolean)
            .join('\n');

          console.log('[API] Producto encontrado en fuente pública:', {
            source: resultado.source,
            nombre,
            marca,
            categoria,
          });
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          );

          Alert.alert(
            'Producto encontrado',
            detalle || `Se encontró información para el código ${normalized}.`,
            [
              { text: 'Escanear otro', onPress: resetScannerState },
              { text: 'Cancelar', style: 'cancel', onPress: cerrar },
            ],
          );
          return;
        }

        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );

        Alert.alert(
          'Producto no encontrado',
          `No existe un producto con el código:\n${normalized}`,
          [
            { text: 'Escanear otro', onPress: resetScannerState },
            { text: 'Cancelar', style: 'cancel', onPress: cerrar },
          ],
        );
      } catch (error) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        );
        const msg = error instanceof Error ? error.message : 'Error inesperado al buscar el producto';
        console.error('[SCANNER] Error al procesar código:', error);
        Alert.alert('Error de conexión', msg, [{ text: 'OK', onPress: cerrar }]);
      } finally {
        setLoading(false);
      }
    },
    [buscarProductoEscaneado, cerrar, loading, navigation, origen, resetScannerState, scanned],
  );

  // Cargando permisos
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

  // Permiso denegado
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

  // ══════════════════════════════════════════════════════════
  // CÁMARA ACTIVA — Todo se posiciona ABSOLUTO sobre la cámara
  // ══════════════════════════════════════════════════════════
  return (
    <View style={styles.root}>
      {/* Capa base: cámara a pantalla completa */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        onMountError={(error) => {
          console.error('Camera error:', error);
          setCameraError(error?.message || 'Error al iniciar cámara');
        }}
        barcodeScannerSettings={{
          barcodeTypes: [...BARCODE_TYPES],
        }}
      />

      {/* Capa 1: Header en la parte de arriba */}
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
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#FFF"
            />
          </Pressable>
          <Text style={styles.headerTitleGlass}>Escanear código</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      {/* Capa 2: Marco de escaneo centrado */}
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
            <Text style={styles.badgeText}>Procesando...</Text>
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

      {/* Capa 3: Footer en la parte de abajo */}
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
              ? 'El código se colocará en el formulario.'
              : 'El producto se agregará al carrito.'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Contenedor raíz
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  safe: { flex: 1, backgroundColor: colors.bg },

  // ─── Header normal (permiso denegado) ───
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

  // ─── Header flotante sobre cámara ───
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtnGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  headerTitleGlass: {
    ...typography.h3,
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ─── Marco de escaneo (centro) ───
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

  // ─── Footer flotante ───
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

  // ─── Centro (para loading y permisos) ───
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