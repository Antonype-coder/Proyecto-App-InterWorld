import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useSuccessPulse } from '@hooks/useSuccessPulse';
import { promocionesApi, productosApi, categoriasApi } from '@api/index';
import type {
  TipoPromocion,
  AplicaA,
  Producto,
  Categoria,
  MasStackParamList,
} from '@tipos/index';
import KeyboardScreen from '@components/layout/KeyboardScreen';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import FormattedNumberInput from '@components/forms/FormattedNumberInput';
import Toast from '@components/ui/Toast';
import { SuccessPulse } from '@components/feedback';
import type { ToastVariant } from '@tipos/index';

type Params = RouteProp<MasStackParamList, 'PromocionForm'>;

const TIPOS: { value: TipoPromocion; label: string }[] = [
  { value: 'porcentaje', label: '% Descuento' },
  { value: 'monto_fijo', label: '$ Descuento' },
  { value: 'precio_especial', label: 'Precio especial' },
  { value: '2x1', label: '2x1' },
  { value: '3x2', label: '3x2' },
];

const APLICACIONES: { value: AplicaA; label: string }[] = [
  { value: 'producto', label: 'Producto' },
  { value: 'categoria', label: 'Categoría' },
  { value: 'global', label: 'Global' },
];

export default function PromocionFormScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const promocionId = route.params?.promocionId;
  const editando = typeof promocionId === 'number';
  const colors = useColors();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<TipoPromocion>('porcentaje');
  const [valor, setValor] = useState('0');
  const [aplicaA, setAplicaA] = useState<AplicaA>('producto');
  const [productoId, setProductoId] = useState<number | null>(null);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [cantidadMinima, setCantidadMinima] = useState('1');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [activo, setActivo] = useState(true);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editando);
  const [pulseVisible, triggerPulse] = useSuccessPulse();

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  useEffect(() => {
    (async () => {
      try {
        const [prods, cats] = await Promise.all([
          productosApi.listar({ activo: 1, limit: 500 }),
          categoriasApi.listar(1),
        ]);
        setProductos(prods.items);
        setCategorias(cats);

        if (editando && promocionId) {
          const p = await promocionesApi.obtener(promocionId);
          setNombre(p.nombre);
          setDescripcion(p.descripcion ?? '');
          setTipo(p.tipo);
          setValor(p.valor);
          setAplicaA(p.aplica_a);
          setProductoId(p.producto_id);
          setCategoriaId(p.categoria_id);
          setCantidadMinima(String(p.cantidad_minima));
          setFechaInicio(p.fecha_inicio.split(' ')[0]);
          setFechaFin(p.fecha_fin.split(' ')[0]);
          setActivo(p.activo === 1);
        } else {
          const hoy = new Date();
          const fin = new Date();
          fin.setDate(fin.getDate() + 30);
          setFechaInicio(toISODate(hoy));
          setFechaFin(toISODate(fin));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error';
        setToast({ visible: true, message: msg, variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [editando, promocionId]);

  const onSubmit = async (): Promise<void> => {
    if (nombre.trim().length < 3) {
      setToast({ visible: true, message: 'Nombre requerido', variant: 'error' });
      return;
    }
    if (!fechaInicio || !fechaFin) {
      setToast({ visible: true, message: 'Fechas requeridas', variant: 'error' });
      return;
    }
    if (fechaFin <= fechaInicio) {
      setToast({
        visible: true,
        message: 'La fecha fin debe ser posterior a la fecha inicio.',
        variant: 'error',
      });
      return;
    }
    if (aplicaA === 'producto' && productoId === null) {
      setToast({
        visible: true,
        message: 'Selecciona el producto de la promoción.',
        variant: 'error',
      });
      return;
    }
    if (aplicaA === 'categoria' && categoriaId === null) {
      setToast({
        visible: true,
        message: 'Selecciona la categoría de la promoción.',
        variant: 'error',
      });
      return;
    }
    if (['porcentaje', 'monto_fijo', 'precio_especial'].includes(tipo)) {
      const numericValue = Number(valor);
      if (
        !Number.isFinite(numericValue) ||
        numericValue <= 0 ||
        (tipo === 'porcentaje' && numericValue > 100)
      ) {
        setToast({
          visible: true,
          message:
            tipo === 'porcentaje'
              ? 'El porcentaje debe estar entre 1 y 100.'
              : 'Ingresa un valor mayor que cero.',
          variant: 'error',
        });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        tipo,
        valor: Number(valor) || 0,
        aplica_a: aplicaA,
        producto_id: aplicaA === 'producto' ? productoId : null,
        categoria_id: aplicaA === 'categoria' ? categoriaId : null,
        cantidad_minima: Number(cantidadMinima) || 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        activo: activo ? 1 : 0,
      };
      if (editando && promocionId) {
        await promocionesApi.actualizar(promocionId, payload);
      } else {
        await promocionesApi.crear(payload);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      triggerPulse();
      setTimeout(() => navigation.goBack(), 700);
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
          title={editando ? 'Editar promoción' : 'Nueva promoción'}
          onBack={() => navigation.goBack()}
        />
      }
      footer={
        <Button
          label={editando ? 'Guardar cambios' : 'Crear promoción'}
          onPress={onSubmit}
          loading={saving}
          disabled={saving || loading}
          variant="primary"
          size="lg"
          fullWidth
        />
      }
    >
      <Card variant="default" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Información
        </Text>
        <Input label="Nombre" value={nombre} onChangeText={setNombre} required />
        <Input
          label="Descripción"
          placeholder="Opcional"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
        />
      </Card>

      <Card variant="default" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Tipo de promoción
        </Text>
        <View style={styles.chipsWrap}>
          {TIPOS.map((t) => (
            <ChipBtn
              key={t.value}
              label={t.label}
              active={tipo === t.value}
              onPress={() => setTipo(t.value)}
            />
          ))}
        </View>

        {tipo === 'porcentaje' ||
        tipo === 'monto_fijo' ||
        tipo === 'precio_especial' ? (
          <FormattedNumberInput
            label={tipo === 'porcentaje' ? 'Porcentaje (%)' : 'Valor ($)'}
            value={valor}
            onChangeText={setValor}
          />
        ) : null}
      </Card>

      <Card variant="default" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Aplica a
        </Text>
        <View style={styles.chipsWrap}>
          {APLICACIONES.map((a) => (
            <ChipBtn
              key={a.value}
              label={a.label}
              active={aplicaA === a.value}
              onPress={() => setAplicaA(a.value)}
            />
          ))}
        </View>

        {aplicaA === 'producto' ? (
          <>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Producto
            </Text>
            <View style={styles.selector}>
              {productos.slice(0, 30).map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setProductoId(p.id)}
                  style={[
                    styles.selectorItem,
                    { backgroundColor: colors.bgSubtle },
                    productoId === p.id
                      ? { backgroundColor: colors.primary }
                      : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      { color: colors.textPrimary },
                      productoId === p.id
                        ? {
                            color: colors.textInverse,
                            fontFamily: typography.button.fontFamily,
                          }
                        : null,
                    ]}
                    numberOfLines={1}
                  >
                    {p.nombre}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {aplicaA === 'categoria' ? (
          <>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Categoría
            </Text>
            <View style={styles.chipsWrap}>
              {categorias.map((c) => (
                <ChipBtn
                  key={c.id}
                  label={c.nombre}
                  active={categoriaId === c.id}
                  onPress={() => setCategoriaId(c.id)}
                />
              ))}
            </View>
          </>
        ) : null}
      </Card>

      <Card variant="default" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Vigencia
        </Text>
        <Input
          label="Fecha inicio"
          value={fechaInicio}
          onChangeText={setFechaInicio}
          required
        />
        <Input
          label="Fecha fin"
          value={fechaFin}
          onChangeText={setFechaFin}
          required
        />
      </Card>

      <Card variant="default" style={styles.section}>
        <Pressable onPress={() => setActivo((v) => !v)} style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>
              Promoción activa
            </Text>
            <Text style={[styles.switchHelper, { color: colors.textMuted }]}>
              {activo
                ? 'Se aplicará automáticamente en el POS'
                : 'No se aplicará'}
            </Text>
          </View>
          <View
            style={[
              styles.check,
              { borderColor: colors.border },
              activo
                ? {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  }
                : null,
            ]}
          >
            {activo ? (
              <Text style={{ color: colors.textInverse, fontSize: 14 }}>✓</Text>
            ) : null}
          </View>
        </Pressable>
      </Card>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <SuccessPulse
        visible={pulseVisible}
        label={editando ? 'Promoción actualizada' : 'Promoción creada'}
      />
    </KeyboardScreen>
  );
}

function ChipBtn(props: {
  label: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  const colors = useColors();
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.chip,
        { backgroundColor: colors.surface, borderColor: colors.border },
        props.active
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : null,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: colors.textSecondary },
          props.active
            ? {
                color: colors.textInverse,
                fontFamily: typography.button.fontFamily,
              }
            : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { ...typography.small },
  label: { ...typography.bodyBold, marginBottom: spacing.sm },
  selector: { gap: spacing.xs, maxHeight: 200 },
  selectorItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  selectorText: { ...typography.small },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchLabel: { ...typography.bodyBold },
  switchHelper: { ...typography.small, marginTop: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});