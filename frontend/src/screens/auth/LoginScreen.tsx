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
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { loginSchema, type LoginFormData } from '@utils/validators';
import { useAuthStore } from '@store/authStore';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';
import Toast from '@components/ui/Toast';
import type { ToastVariant } from '@tipos/index';

export default function LoginScreen(): React.ReactElement {
  const colors = useColors();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: '', variant: 'info' });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as never,
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    try {
      await login(data.email.trim(), data.password);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al iniciar sesión';
      setToast({ visible: true, message: msg, variant: 'error' });
    }
  };

  const rellenarDemo = (rol: 'admin' | 'vendedor'): void => {
    if (rol === 'admin') {
      setValue('email', 'admin@tienda.com');
      setValue('password', 'admin123');
    } else {
      setValue('email', 'vendedor@tienda.com');
      setValue('password', 'vendedor123');
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
          <View style={styles.brandSection}>
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
                name="storefront-outline"
                size={32}
                color={colors.textPrimary}
              />
            </View>
            <Text style={[styles.brandName, { color: colors.textPrimary }]}>
              InterWorld
            </Text>
            <Text
              style={[styles.brandTagline, { color: colors.textSecondary }]}
            >
              Tu tienda, bajo control.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
              Iniciar sesión
            </Text>
            <Text
              style={[styles.formSubtitle, { color: colors.textSecondary }]}
            >
              Ingresa tus credenciales para continuar
            </Text>

            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Correo electrónico"
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
                    placeholder="Ingresa tu contraseña"
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

              <Button
                label="Ingresar"
                onPress={() => {
                  void handleSubmit(onSubmit)();
                }}
                loading={loading}
                disabled={loading}
                variant="primary"
                size="lg"
                fullWidth
              />
            </View>

            <View style={styles.demoSection}>
              <View style={styles.demoHeader}>
                <View
                  style={[
                    styles.demoLine,
                    { backgroundColor: colors.border },
                  ]}
                />
                <Text
                  style={[styles.demoLabel, { color: colors.textMuted }]}
                >
                  CUENTAS DE PRUEBA
                </Text>
                <View
                  style={[
                    styles.demoLine,
                    { backgroundColor: colors.border },
                  ]}
                />
              </View>

              <View style={styles.demoRow}>
                <DemoButton
                  icon="shield-account-outline"
                  label="Admin"
                  onPress={() => rellenarDemo('admin')}
                />
                <DemoButton
                  icon="account-outline"
                  label="Vendedor"
                  onPress={() => rellenarDemo('vendedor')}
                />
              </View>
            </View>
          </View>

          <Text style={[styles.footer, { color: colors.textMuted }]}>
            v2.0.0
          </Text>
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

function DemoButton(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}): React.ReactElement {
  const colors = useColors();

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.demoButton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed ? { backgroundColor: colors.surfacePressed } : null,
      ]}
    >
      <MaterialCommunityIcons
        name={props.icon}
        size={16}
        color={colors.textSecondary}
      />
      <Text style={[styles.demoButtonText, { color: colors.textPrimary }]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
    minHeight: '100%',
  },

  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.giant,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  brandName: { ...typography.h1 },
  brandTagline: {
    ...typography.caption,
    marginTop: spacing.xs,
  },

  formSection: { marginBottom: spacing.xxl },
  formTitle: { ...typography.h2 },
  formSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  form: { marginBottom: spacing.xl },

  demoSection: { marginTop: spacing.lg },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  demoLine: {
    flex: 1,
    height: 1,
  },
  demoLabel: {
    ...typography.overline,
    marginHorizontal: spacing.md,
  },
  demoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  demoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  demoButtonText: {
    ...typography.buttonSmall,
  },

  footer: {
    ...typography.small,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});