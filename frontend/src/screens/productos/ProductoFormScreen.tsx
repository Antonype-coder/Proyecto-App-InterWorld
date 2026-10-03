// src/screens/productos/ProductoFormScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, spacing, typography, radius } from '@theme/index';
import { productoSchema, type ProductoFormData } from '@utils/validators';
import {
  productosApi,
  categoriasApi,
  proveedoresApi,
  uploadsApi,
  buscarEnCatalogosPublicos,
  catalogoPublicoLabel,
} from '@api/index';
import type { Categoria, Proveedor, ProductosStackParamList } from '@tipos/index';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Toast from '@components/ui/Toast';
import Input from '@components/ui/Input';
import Modal from '@components/ui/Modal';
import FormInput from '@components/forms/FormInput';
import FormNumberInput from '@components/forms/FormNumberInput';
import FormSearchPicker from '@components/forms/FormSearchPicker';
import ProductoImageCarousel from '@components/domain/ProductoImageCarousel';
import type { ToastVariant } from '@tipos/index';
import { getImageUrl } from '@utils/image';

type Params = RouteProp<ProductosStackParamList, 'ProductoForm'>;

interface FotoProducto {
  path: string;
  file?: { uri: string; name: string; type: string };
}

export default function ProductoFormScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const productId = route.params?.productId;
  const editando = typeof productId === 'number';

  const [loading, setLoading] = useState(editando);
  const [saving, setSaving] = useState(false);
  const [activo, setActivo] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [fotos, setFotos] = useState<FotoProducto[]>([]);
  const [modalCategoriaVisible, setModalCategoriaVisible] = useState(false);
  const [savingCategoria, setSavingCategoria] = useState(false);
  const [categoriaNombre, setCategoriaNombre] = useState('');
  const [categoriaDescripcion, setCategoriaDescripcion] = useState('');
  const [modalProveedorVisible, setModalProveedorVisible] = useState(false);
  const [savingProveedor, setSavingProveedor] = useState(false);
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [proveedorContacto, setProveedorContacto] = useState('');
  const [proveedorTelefono, setProveedorTelefono] = useState('');
  const [proveedorEmail, setProveedorEmail] = useState('');
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
  } = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema) as never,
    defaultValues: {
      codigo_barras: '',
      nombre: '',
      descripcion: '',
      categoria_id: null,
      proveedor_id: null,
      precio_compra: 0,
      precio_venta: 0,
      stock: 0,
      stock_minimo: 5,
    },
  });

  // Carga inicial: categorías, proveedores y producto (si editamos)
  useEffect(() => {
    (async () => {
      try {
        const [cats, provs] = await Promise.all([
          categoriasApi.listar(1),
          proveedoresApi.listar(1),
        ]);
        setCategorias(cats);
        setProveedores(provs);

        if (editando && productId) {
          const p = await productosApi.obtener(productId);
          const imagenes = p.imagenes?.length
            ? p.imagenes
            : p.imagen
              ? [p.imagen]
              : [];
          setFotos(imagenes.map((path) => ({ path })));
          reset({
            codigo_barras: p.codigo_barras,
            nombre: p.nombre,
            descripcion: p.descripcion ?? '',
            categoria_id: p.categoria_id,
            proveedor_id: p.proveedor_id,
            precio_compra: parseFloat(p.precio_compra),
            precio_venta: parseFloat(p.precio_venta),
            stock: p.stock,
            stock_minimo: p.stock_minimo,
          });
          setActivo(p.activo === 1);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al cargar';
        setToast({ visible: true, message: msg, variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [editando, productId, reset]);

  // Escuchar cuando volvemos del escáner con un código
  useFocusEffect(
    React.useCallback(() => {
      const codigoEscaneado = route.params?.codigoEscaneado;
      if (codigoEscaneado) {
        const normalized = String(codigoEscaneado).trim();
        setValue('codigo_barras', normalized, { shouldValidate: true });

        (async () => {
          try {
            let productoLocal = null;
            try {
              productoLocal = await productosApi.buscarPorCodigo(normalized);
            } catch {
              productoLocal = null;
            }

            if (productoLocal && productoLocal.id !== productId) {
              navigation.setParams({ codigoEscaneado: undefined });
              navigation.navigate('ProductoDetalle', {
                productId: productoLocal.id,
              });
              return;
            }

            if (productoLocal) {
              const imagenes = productoLocal.imagenes?.length
                ? productoLocal.imagenes
                : productoLocal.imagen
                  ? [productoLocal.imagen]
                  : [];
              if (fotos.length === 0 && imagenes.length > 0) {
                setFotos(imagenes.map((path) => ({ path })));
              }
              setToast({
                visible: true,
                message: 'Fotos cargadas desde este producto.',
                variant: 'success',
              });
              return;
            }

            const resultadoCatalogo = await buscarEnCatalogosPublicos(normalized);
            const productoEncontrado = resultadoCatalogo?.producto ?? null;

            if (resultadoCatalogo && productoEncontrado) {
              const nombre = productoEncontrado.product_name ?? '';
              const descripcion = productoEncontrado.ingredients_text ?? '';
              const imagen = productoEncontrado.image_front_url ?? productoEncontrado.image_url;

              if (nombre) setValue('nombre', nombre, { shouldValidate: true });
              if (descripcion) {
                setValue('descripcion', descripcion, { shouldValidate: true });
              }

              if (imagen && fotos.length === 0) {
                setFotos([{ path: imagen }]);
              }

              setToast({
                visible: true,
                message: `Producto detectado en ${catalogoPublicoLabel[resultadoCatalogo.source]}: ${nombre || 'código encontrado'}`,
                variant: 'success',
              });
            } else {
              setToast({
                visible: true,
                message: `Código detectado: ${normalized}`,
                variant: 'info',
              });
            }
          } catch {
            setToast({
              visible: true,
              message: `Código detectado: ${normalized}`,
              variant: 'info',
            });
          }
        })();

        navigation.setParams({ codigoEscaneado: undefined });
      }
    }, [route.params?.codigoEscaneado, setValue, navigation, fotos.length]),
  );

  const abrirScanner = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ProductoScanner', { origen: 'formulario' });
  };

  const guardarFotos = (assets: ImagePicker.ImagePickerAsset[]): void => {
    setFotos((current) => {
      const restantes = Math.max(0, 8 - current.length);
      const nuevas = assets.slice(0, restantes).map((asset) => {
        const type = asset.mimeType ?? 'image/jpeg';
        const extension = type.split('/')[1] ?? 'jpg';
        return {
          path: asset.uri,
          file: {
            uri: asset.uri,
            name:
              asset.fileName ??
              `producto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`,
            type,
          },
        };
      });

      if (assets.length > restantes) {
        setToast({
          visible: true,
          message: 'Cada producto puede tener hasta 8 fotos.',
          variant: 'warning',
        });
      }
      return [...current, ...nuevas];
    });
  };

  const seleccionarFoto = async (): Promise<void> => {
    const disponibles = 8 - fotos.length;
    if (disponibles <= 0) {
      setToast({ visible: true, message: 'Cada producto puede tener hasta 8 fotos.', variant: 'warning' });
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: disponibles,
        quality: 0.8,
      });
      if (result.canceled) return;
      guardarFotos(result.assets);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo abrir la galería';
      setToast({ visible: true, message: msg, variant: 'error' });
    }
  };

  const tomarFoto = async (): Promise<void> => {
    if (fotos.length >= 8) {
      setToast({ visible: true, message: 'Cada producto puede tener hasta 8 fotos.', variant: 'warning' });
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setToast({
          visible: true,
          message: 'Permite el acceso a la cámara para tomar la foto.',
          variant: 'error',
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) guardarFotos(result.assets);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo abrir la cámara';
      setToast({ visible: true, message: msg, variant: 'error' });
    }
  };

  const crearCategoria = async (): Promise<void> => {
    const nombre = categoriaNombre.trim();
    if (nombre.length < 2) {
      setToast({
        visible: true,
        message: 'Escribe el nombre de la categoría.',
        variant: 'error',
      });
      return;
    }

    setSavingCategoria(true);
    try {
      const categoria = await categoriasApi.crear({
        nombre,
        descripcion: categoriaDescripcion.trim() || undefined,
        activo: 1,
      });
      setCategorias((current) => [...current, categoria]);
      setValue('categoria_id', categoria.id, { shouldDirty: true });
      setCategoriaNombre('');
      setCategoriaDescripcion('');
      setModalCategoriaVisible(false);
      setToast({
        visible: true,
        message: 'Categoría agregada y seleccionada.',
        variant: 'success',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo agregar la categoría';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSavingCategoria(false);
    }
  };

  const crearProveedor = async (): Promise<void> => {
    const nombre = proveedorNombre.trim();
    if (nombre.length < 2) {
      setToast({
        visible: true,
        message: 'Escribe el nombre del proveedor.',
        variant: 'error',
      });
      return;
    }

    setSavingProveedor(true);
    try {
      const proveedor = await proveedoresApi.crear({
        nombre,
        contacto: proveedorContacto.trim() || undefined,
        telefono: proveedorTelefono.trim() || undefined,
        email: proveedorEmail.trim() || undefined,
      });
      setProveedores((current) => [...current, proveedor]);
      setValue('proveedor_id', proveedor.id, { shouldDirty: true });
      setProveedorNombre('');
      setProveedorContacto('');
      setProveedorTelefono('');
      setProveedorEmail('');
      setModalProveedorVisible(false);
      setToast({
        visible: true,
        message: 'Proveedor agregado y seleccionado.',
        variant: 'success',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo agregar el proveedor';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSavingProveedor(false);
    }
  };

  const onSubmit = async (data: ProductoFormData): Promise<void> => {
    setSaving(true);
    try {
      const imagenesGuardadas: string[] = [];
      for (const foto of fotos) {
        if (foto.file) {
          imagenesGuardadas.push((await uploadsApi.imagenProducto(foto.file)).path);
        } else if (/^https?:\/\//i.test(foto.path)) {
          imagenesGuardadas.push((await uploadsApi.imagenProductoDesdeUrl(foto.path)).path);
        } else {
          imagenesGuardadas.push(foto.path);
        }
      }
      const payload = {
        codigo_barras: data.codigo_barras.trim(),
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || undefined,
        categoria_id: data.categoria_id ?? null,
        proveedor_id: data.proveedor_id ?? null,
        precio_compra: Number(data.precio_compra) || 0,
        precio_venta: Number(data.precio_venta) || 0,
        stock: Number(data.stock) || 0,
        stock_minimo: Number(data.stock_minimo) || 0,
        imagen: imagenesGuardadas[0] ?? null,
        imagenes: imagenesGuardadas,
        activo: activo ? 1 : 0,
      };

      if (editando && productId) {
        await productosApi.actualizar(productId, payload);
      } else {
        await productosApi.crear(payload);
      }

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      navigation.goBack();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al guardar';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardScreen
      header={
        <TopBar
          title={editando ? 'Editar producto' : 'Nuevo producto'}
          onBack={() => navigation.goBack()}
        />
      }
      contentContainerStyle={{ padding: 0 }}
    >
      <View style={styles.content}>
        <Card variant="default" style={styles.imageCard}>
          <ProductoImageCarousel
            images={fotos.map((foto) => foto.path)}
            height={190}
            onRemove={(index) => setFotos((current) => current.filter((_, i) => i !== index))}
          />
          <View style={styles.imageActions}>
            <Button
              label="Tomar foto"
              icon="camera-outline"
              variant="outline"
              onPress={() => {
                void tomarFoto();
              }}
              disabled={fotos.length >= 8}
              style={styles.imageAction}
            />
            <Button
              label={fotos.length > 0 ? 'Agregar fotos' : 'Elegir fotos'}
              icon="image-outline"
              variant="outline"
              onPress={() => {
                void seleccionarFoto();
              }}
              disabled={fotos.length >= 8}
              style={styles.imageAction}
            />
          </View>
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Información básica</Text>

          {/* Campo de código de barras con botón de escáner */}
          <View style={styles.codigoWrapper}>
            <View style={{ flex: 1 }}>
              <FormInput
                control={control}
                name="codigo_barras"
                label="Código de barras"
                icon="barcode"
                required
              />
            </View>
            <Pressable
              onPress={abrirScanner}
              style={styles.scanBtn}
              accessibilityLabel="Escanear código de barras"
            >
              <MaterialCommunityIcons
                name="barcode-scan"
                size={22}
                color={colors.textInverse}
              />
            </Pressable>
          </View>

          <FormInput
            control={control}
            name="nombre"
            label="Nombre"
            icon="package-variant"
            required
          />
          <FormInput
            control={control}
            name="descripcion"
            label="Descripción"
            placeholder="Opcional"
            multiline
          />
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Precios</Text>
          <FormNumberInput
            control={control}
            name="precio_compra"
            label="Precio de compra"
            icon="currency-usd"
          />
          <FormNumberInput
            control={control}
            name="precio_venta"
            label="Precio de venta"
            icon="tag-outline"
            required
          />
        </Card>

        {!editando ? (
          <Card variant="default" style={styles.section}>
            <Text style={styles.sectionTitle}>Stock</Text>
            <FormNumberInput
              control={control}
              name="stock"
              label="Stock inicial"
              icon="archive-outline"
              integer
            />
            <FormNumberInput
              control={control}
              name="stock_minimo"
              label="Stock mínimo"
              icon="alert-outline"
              integer
              helper="Se alertará cuando el stock baje a este nivel"
            />
          </Card>
        ) : (
          <Card variant="default" style={styles.section}>
            <Text style={styles.sectionTitle}>Stock</Text>
            <FormNumberInput
              control={control}
              name="stock_minimo"
              label="Stock mínimo"
              icon="alert-outline"
              integer
              helper="Se alertará cuando el stock baje a este nivel"
            />
          </Card>
        )}

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Clasificación</Text>
          <FormSearchPicker
            control={control}
            name="categoria_id"
            label="Categoría"
            placeholder="Sin categoría"
            icon="shape-outline"
            options={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
          />
          <Button
            label="Agregar categoría"
            icon="plus-box-outline"
            variant="ghost"
            size="sm"
            onPress={() => setModalCategoriaVisible(true)}
            style={styles.addSupplierButton}
          />
          <FormSearchPicker
            control={control}
            name="proveedor_id"
            label="Proveedor"
            placeholder="Sin proveedor"
            icon="truck-outline"
            options={proveedores.map((p) => ({ id: p.id, nombre: p.nombre }))}
          />
          <Button
            label="Agregar proveedor"
            icon="account-plus-outline"
            variant="ghost"
            size="sm"
            onPress={() => setModalProveedorVisible(true)}
            style={styles.addSupplierButton}
          />
        </Card>

        {editando ? (
          <Card variant="default" style={styles.section}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Producto activo</Text>
                <Text style={styles.switchHelper}>
                  Los inactivos no aparecen en el POS
                </Text>
              </View>
              <Switch
                value={activo}
                onValueChange={setActivo}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
          </Card>
        ) : null}

        <Button
          label={editando ? 'Guardar cambios' : 'Crear producto'}
          onPress={() => {
            void handleSubmit(onSubmit)();
          }}
          loading={saving}
          disabled={saving || loading}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
      <Modal
        visible={modalCategoriaVisible}
        onClose={() => setModalCategoriaVisible(false)}
        title="Nueva categoría"
        scrollable
        footer={
          <View style={styles.modalActions}>
            <Button
              label="Cancelar"
              variant="outline"
              onPress={() => setModalCategoriaVisible(false)}
              style={styles.modalButton}
            />
            <Button
              label="Guardar"
              loading={savingCategoria}
              disabled={savingCategoria}
              onPress={() => {
                void crearCategoria();
              }}
              style={styles.modalButton}
            />
          </View>
        }
      >
        <Input
          label="Nombre de la categoría"
          value={categoriaNombre}
          onChangeText={setCategoriaNombre}
          autoCapitalize="words"
          required
        />
        <Input
          label="Descripción"
          value={categoriaDescripcion}
          onChangeText={setCategoriaDescripcion}
          multiline
          numberOfLines={3}
        />
      </Modal>
      <Modal
        visible={modalProveedorVisible}
        onClose={() => setModalProveedorVisible(false)}
        title="Nuevo proveedor"
        scrollable
        footer={
          <View style={styles.modalActions}>
            <Button
              label="Cancelar"
              variant="outline"
              onPress={() => setModalProveedorVisible(false)}
              style={styles.modalButton}
            />
            <Button
              label="Guardar"
              loading={savingProveedor}
              disabled={savingProveedor}
              onPress={() => {
                void crearProveedor();
              }}
              style={styles.modalButton}
            />
          </View>
        }
      >
        <Input
          label="Nombre del proveedor"
          value={proveedorNombre}
          onChangeText={setProveedorNombre}
          autoCapitalize="words"
          required
        />
        <Input
          label="Persona de contacto"
          value={proveedorContacto}
          onChangeText={setProveedorContacto}
          autoCapitalize="words"
        />
        <Input
          label="Teléfono"
          value={proveedorTelefono}
          onChangeText={setProveedorTelefono}
          keyboardType="phone-pad"
        />
        <Input
          label="Correo electrónico"
          value={proveedorEmail}
          onChangeText={setProveedorEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Modal>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingBottom: spacing.giant,
  },
  imageCard: {
    marginBottom: spacing.md,
  },
  imageActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  imageAction: { flex: 1 },
  addSupplierButton: { alignSelf: 'flex-start', marginTop: -spacing.sm },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalButton: { flex: 1 },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchLabel: { ...typography.bodyBold, color: colors.textPrimary },
  switchHelper: { ...typography.small, color: colors.textMuted, marginTop: 2 },

  // Fila de código de barras con escáner
  codigoWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
});