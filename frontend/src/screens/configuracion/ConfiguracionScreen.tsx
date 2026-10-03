import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { colors, radius, spacing, typography } from '@theme/index';
import { useConfiguracionStore } from '@store/configuracionStore';
import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';
import { uploadsApi } from '@api/index';
import { getImageUrl } from '@utils/image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopBar from '@components/layout/TopBar';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import FormattedNumberInput from '@components/forms/FormattedNumberInput';
import Switch from '@components/ui/Switch';
import Loader from '@components/ui/Loader';
import Toast from '@components/ui/Toast';
import type { ToastVariant } from '@tipos/index';

export default function ConfiguracionScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const { data, loading, cargar, actualizar } = useConfiguracionStore();
  const actualizarLogo = useConfiguracionStore((state) => state.actualizarLogo);
  const eliminarLogo = useConfiguracionStore((state) => state.eliminarLogo);
  const esAdmin = useAuthStore((state) => state.user?.rol === 'admin');
  const showToast = useUIStore((s) => s.showToast);

  const [negocioNombre, setNegocioNombre] = useState('');
  const [negocioNit, setNegocioNit] = useState('');
  const [negocioTelefono, setNegocioTelefono] = useState('');
  const [negocioDireccion, setNegocioDireccion] = useState('');
  const [negocioEmail, setNegocioEmail] = useState('');
  const [impuesto, setImpuesto] = useState('0');
  const [impuestoIncluido, setImpuestoIncluido] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const logoValue = data?.negocio?.logo_url ?? data?.general?.logo_url;
  const logoPath = typeof logoValue === 'string' && logoValue.trim() ? logoValue : null;

  const cargarDatos = useCallback(async (): Promise<void> => {
    await cargar();
  }, [cargar]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (data) {
      const neg = data.negocio ?? {};
      const imp = data.impuestos ?? {};
      setNegocioNombre(String(neg.negocio_nombre ?? ''));
      setNegocioNit(String(neg.negocio_nit ?? ''));
      setNegocioTelefono(String(neg.negocio_telefono ?? ''));
      setNegocioDireccion(String(neg.negocio_direccion ?? ''));
      setNegocioEmail(String(neg.negocio_email ?? ''));
      setImpuesto(String(imp.impuesto_porcentaje ?? '0'));
      setImpuestoIncluido(Boolean(imp.impuesto_incluido ?? true));
    }
  }, [data]);

  const guardar = async (): Promise<void> => {
    setSaving(true);
    try {
      await actualizar({
        negocio_nombre: negocioNombre,
        negocio_nit: negocioNit,
        negocio_telefono: negocioTelefono,
        negocio_direccion: negocioDireccion,
        negocio_email: negocioEmail,
        impuesto_porcentaje: impuesto,
        impuesto_incluido: impuestoIncluido ? '1' : '0',
      });
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      setToast({
        visible: true,
        message: 'Configuración guardada',
        variant: 'success',
      });
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al guardar';
      setToast({ visible: true, message: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const seleccionarLogo = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const extension = mimeType.split('/')[1] ?? 'jpg';
      setSavingLogo(true);
      const uploaded = await uploadsApi.imagenLogo({
        uri: asset.uri,
        name: asset.fileName ?? `logo-${Date.now()}.${extension}`,
        type: mimeType,
      });
      await actualizarLogo(uploaded.path);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast({ visible: true, message: 'Logo actualizado en la app y los informes.', variant: 'success' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo guardar el logo.';
      setToast({ visible: true, message, variant: 'error' });
    } finally {
      setSavingLogo(false);
    }
  };

  const confirmarQuitarLogo = (): void => {
    Alert.alert('Quitar logo', 'Se quitará el logo del negocio de las pantallas y los informes.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          setSavingLogo(true);
          try {
            await eliminarLogo();
            setToast({ visible: true, message: 'Logo eliminado.', variant: 'success' });
          } catch (e) {
            const message = e instanceof Error ? e.message : 'No se pudo quitar el logo.';
            setToast({ visible: true, message, variant: 'error' });
          } finally {
            setSavingLogo(false);
          }
        },
      },
    ]);
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TopBar title="Configuración" onBack={() => navigation.goBack()} />
        <Loader message="Cargando configuración" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Configuración" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Logo del negocio</Text>
          <View style={styles.logoRow}>
            <View style={styles.logoPreview}>
              {logoPath ? (
                <Image
                  source={{ uri: getImageUrl(logoPath) ?? undefined }}
                  style={styles.logoImage}
                  contentFit="contain"
                  cachePolicy="disk"
                />
              ) : (
                <MaterialCommunityIcons name="storefront-outline" size={30} color={colors.textMuted} />
              )}
            </View>
            <Text style={styles.logoHint}>
              Aparecerá en las pantallas y en los informes PDF.
            </Text>
          </View>
          <View style={styles.logoActions}>
            <Button
              label={logoPath ? 'Cambiar logo' : 'Agregar logo'}
              icon="image-edit-outline"
              onPress={() => void seleccionarLogo()}
              loading={savingLogo}
              disabled={savingLogo}
              variant="outline"
              style={styles.logoButton}
            />
            {logoPath ? (
              <Button
                label="Quitar"
                icon="delete-outline"
                onPress={confirmarQuitarLogo}
                disabled={savingLogo}
                variant="ghost"
                style={styles.logoButton}
              />
            ) : null}
          </View>
        </Card>

        {esAdmin ? <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del negocio</Text>
          <Input
            label="Nombre"
            icon="storefront-outline"
            value={negocioNombre}
            onChangeText={setNegocioNombre}
          />
          <Input
            label="NIT"
            icon="card-account-details-outline"
            value={negocioNit}
            onChangeText={setNegocioNit}
          />
          <Input
            label="Teléfono"
            icon="phone-outline"
            keyboardType="phone-pad"
            value={negocioTelefono}
            onChangeText={setNegocioTelefono}
          />
          <Input
            label="Dirección"
            icon="map-marker-outline"
            value={negocioDireccion}
            onChangeText={setNegocioDireccion}
          />
          <Input
            label="Correo"
            icon="email-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            value={negocioEmail}
            onChangeText={setNegocioEmail}
          />
        </Card> : null}

        {esAdmin ? <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Impuestos</Text>
          <FormattedNumberInput
            label="Porcentaje de impuesto"
            icon="percent-outline"
            value={impuesto}
            onChangeText={setImpuesto}
          />
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>
                Precios incluyen impuesto
              </Text>
              <Text style={styles.switchHelper}>
                Los precios de venta ya incluyen el impuesto
              </Text>
            </View>
            <Switch
              value={impuestoIncluido}
              onValueChange={setImpuestoIncluido}
            />
          </View>
        </Card> : null}

        {esAdmin ? (
          <Button
            label="Guardar cambios"
            onPress={guardar}
            loading={saving}
            disabled={saving}
            variant="primary"
            size="lg"
            fullWidth
          />
        ) : null}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  section: { marginBottom: spacing.md },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  logoPreview: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  logoHint: { ...typography.small, color: colors.textSecondary, flex: 1 },
  logoActions: { flexDirection: 'row', gap: spacing.sm },
  logoButton: { flex: 1 },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  switchLabel: { ...typography.bodyBold, color: colors.textPrimary },
  switchHelper: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});