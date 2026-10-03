import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '@theme/index';
import { movimientoSchema, type MovimientoFormData } from '@utils/validators';
import { productosApi, inventarioApi } from '@api/index';
import type { Producto, InventarioStackParamList } from '@tipos/index';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import Toast from '@components/ui/Toast';
import FormInput from '@components/forms/FormInput';
import FormNumberInput from '@components/forms/FormNumberInput';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<InventarioStackParamList, 'MovimientoForm'>;

export default function MovimientoFormScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const productoIdInicial = route.params?.productoId;

  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSel, setProductoSel] = useState<Producto | null>(null);
  const [modalProductos, setModalProductos] = useState(false);
  const [busquedaProd, setBusquedaProd] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProds, setLoadingProds] = useState(true);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MovimientoFormData>({
    resolver: zodResolver(movimientoSchema) as never,
    defaultValues: {
      producto_id: 0,
      tipo: 'entrada',
      cantidad: 1,
      motivo: '',
    },
  });

  const tipoActual = watch('tipo');

  useEffect(() => {
    (async () => {
      try {
        const res = await productosApi.listar({ activo: 1, limit: 500 });
        setProductos(res.items);

        if (productoIdInicial) {
          const p = res.items.find((x) => x.id === productoIdInicial);
          if (p) {
            setProductoSel(p);
            setValue('producto_id', p.id);
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al cargar';
        setToast({ visible: true, message: msg, variant: 'error' });
      } finally {
        setLoadingProds(false);
      }
    })();
  }, [productoIdInicial, setValue]);

  const onSubmit = async (data: MovimientoFormData): Promise<void> => {
    if (!productoSel) {
      setToast({
        visible: true,
        message: 'Selecciona un producto',
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      await inventarioApi.registrarMovimiento({
        producto_id: productoSel.id,
        tipo: data.tipo,
        cantidad: Number(data.cantidad),
        motivo: data.motivo,
      });

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      navigation.goBack();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al registrar';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const productosFiltrados = productos.filter((p) => {
    if (!busquedaProd) return true;
    const q = busquedaProd.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.codigo_barras.toLowerCase().includes(q)
    );
  });

  return (
    <KeyboardScreen>
      <TopBar
        title="Movimiento de inventario"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Producto</Text>
          <Pressable
            onPress={() => setModalProductos(true)}
            style={styles.selectBox}
          >
            {productoSel ? (
              <View style={{ flex: 1 }}>
                <Text style={styles.selectValue}>
                  {productoSel.nombre}
                </Text>
                <Text style={styles.selectSub}>
                  {productoSel.codigo_barras} · Stock: {productoSel.stock}
                </Text>
              </View>
            ) : (
              <Text style={styles.selectPlaceholder}>
                Seleccionar producto
              </Text>
            )}
            <MaterialCommunityIcons
              name="chevron-down"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de movimiento</Text>
          <View style={styles.tipoRow}>
            <TipoBtn
              icon="arrow-down"
              label="Entrada"
              active={tipoActual === 'entrada'}
              color={colors.success}
              onPress={() => setValue('tipo', 'entrada')}
            />
            <TipoBtn
              icon="arrow-up"
              label="Salida"
              active={tipoActual === 'salida'}
              color={colors.danger}
              onPress={() => setValue('tipo', 'salida')}
            />
            <TipoBtn
              icon="swap-horizontal"
              label="Ajuste"
              active={tipoActual === 'ajuste'}
              color={colors.info}
              onPress={() => setValue('tipo', 'ajuste')}
            />
          </View>
          <Text style={styles.hintText}>
            {tipoActual === 'entrada'
              ? 'Se sumará al stock actual'
              : tipoActual === 'salida'
                ? 'Se restará del stock actual'
                : 'Se fijará el stock exacto'}
          </Text>
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>
            {tipoActual === 'ajuste' ? 'Stock nuevo' : 'Cantidad'}
          </Text>
          <FormNumberInput
            control={control}
            name="cantidad"
            label={tipoActual === 'ajuste' ? 'Stock final' : 'Cantidad'}
            icon="numeric"
            required
            integer
          />
        </Card>

        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Motivo</Text>
          <FormInput
            control={control}
            name="motivo"
            label="Razón"
            placeholder="Ej: Compra, merma, robo"
            multiline
            required
          />
        </Card>

        <Button
          label="Registrar movimiento"
          onPress={() => {
            void handleSubmit(onSubmit)();
          }}
          loading={saving}
          disabled={saving || loadingProds}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>

      <Modal
        visible={modalProductos}
        onClose={() => setModalProductos(false)}
        title="Seleccionar producto"
        scrollable
      >
        <View style={styles.modalSearchBox}>
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={colors.textMuted}
          />
          <TextInput
            placeholder="Buscar producto"
            placeholderTextColor={colors.textMuted}
            value={busquedaProd}
            onChangeText={setBusquedaProd}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <Pressable
              style={({ pressed }) => [
                styles.modalRow,
                index === productosFiltrados.length - 1
                  ? styles.modalRowLast
                  : null,
                pressed ? styles.modalRowPressed : null,
              ]}
              onPress={() => {
                setProductoSel(item);
                setValue('producto_id', item.id);
                setModalProductos(false);
                setBusquedaProd('');
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.modalNombre}>{item.nombre}</Text>
                <Text style={styles.modalSub}>
                  {item.codigo_barras} · Stock: {item.stock}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Sin resultados</Text>
          }
        />
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </KeyboardScreen>
  );
}

function TipoBtn(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.tipoBtn,
        props.active
          ? { borderColor: props.color, backgroundColor: props.color + '10' }
          : null,
      ]}
    >
      <MaterialCommunityIcons
        name={props.icon}
        size={18}
        color={props.active ? props.color : colors.textMuted}
      />
      <Text
        style={[
          styles.tipoLabel,
          props.active
            ? { color: props.color, fontFamily: typography.button.fontFamily }
            : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.giant },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 52,
  },
  selectPlaceholder: {
    flex: 1,
    ...typography.body,
    color: colors.textMuted,
  },
  selectValue: { ...typography.bodyBold, color: colors.textPrimary },
  selectSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  tipoRow: { flexDirection: 'row', gap: spacing.sm },
  tipoBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  tipoLabel: { ...typography.small, color: colors.textSecondary },
  hintText: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalRowLast: { borderBottomWidth: 0 },
  modalRowPressed: { opacity: 0.7 },
  modalNombre: { ...typography.bodyBold, color: colors.textPrimary },
  modalSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});