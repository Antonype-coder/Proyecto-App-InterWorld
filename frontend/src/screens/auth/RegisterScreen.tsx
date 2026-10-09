import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useAuthStore } from '@store/authStore';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';
import Toast from '@components/ui/Toast';
import type { ToastVariant } from '@tipos/index';

interface FormData {
  negocio_nombre: string;
  nit: string;
  telefono: string;
  nombre: string;
  email: string;
  password: string;
}

export default function RegisterScreen(): React.ReactElement {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const registrarNegocio = useAuthStore((s) => s.registrarNegocio);
  const loading = useAuthStore((s) => s.loading);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({
    defaultValues: {
      negocio_nombre: '',
      nit: '',
      telefono: '',
      nombre: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData): Promise<void> => {
    let valido = true;

    if (data.negocio_nombre.trim().length < 2) {
      setError('negocio_nombre', {
        message: 'Escribe el nombre de tu tienda',
      });
      valido = false;
    }
    if (data.nombre.trim().length < 3) {
      setError('nombre', { message: 'Escribe tu nombre completo' });
      valido = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      setError('email', { message: 'Correo no válido' });
      valido = false;
    }
    if (data.password.length < 6) {
      setError('password', {
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
      valido = false;
    }

    if (!valido) return;

    try {
      await registrarNegocio({
        negocio_nombre: data.negocio_nombre.trim(),
        nit: data.nit.trim() || undefined,
        telefono: data.telefono.trim() || undefined,
        nombre: data.nombre.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        e instanceof Error ? e.message : 'Error al crear la cuenta';
      setToast({ visible: true, message: msg, variant: 'error' });
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={12}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>

          <View style={styles.headerSection}>
            <View
              style={[
                styles.logo,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="store-plus-outline"
                size={28}
                color={colors.textPrimary}
              />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Crea tu tienda
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Configura tu negocio en menos de un minuto
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Datos del negocio
            </Text>

            <Controller
              control={control}
              name="negocio_nombre"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Nombre de la tienda"
                  placeholder="Ej: Abarrotes La Esquina"
                  icon="storefront-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.negocio_nombre?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="nit"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="NIT / RUT (opcional)"
                  placeholder="Ej: 900123456-7"
                  icon="card-account-details-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.nit?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="telefono"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Teléfono (opcional)"
                  placeholder="Ej: 3001234567"
                  keyboardType="phone-pad"
                  icon="phone-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.telefono?.message}
                />
              )}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Tu cuenta de administrador
            </Text>

            <Controller
              control={control}
              name="nombre"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Tu nombre completo"
                  placeholder="Ej: Juan Pérez"
                  icon="account-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.nombre?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Correo electrónico"
                  placeholder="tu@correo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  icon="email-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Contraseña"
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  autoCapitalize="none"
                  icon="lock-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  required
                />
              )}
            />
          </View>

          <Button
            label="Crear mi tienda"
            onPress={() => {
              void handleSubmit(onSubmit)();
            }}
            loading={loading}
            disabled={loading}
            variant="primary"
            size="lg"
            fullWidth
          />

          <View style={styles.loginSection}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              ¿Ya tienes cuenta?
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.loginButton,
                pressed ? { opacity: 0.7 } : null,
              ]}
            >
              <Text style={[styles.loginLink, { color: colors.primary }]}>
                Iniciar sesión
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.giant,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    marginLeft: -spacing.sm,
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h2, textAlign: 'center' },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },

  loginSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  loginText: { ...typography.caption },
  loginButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  loginLink: {
    ...typography.bodyBold,
  },
});