import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, radius, spacing, typography } from '@theme/index';
import { useUIStore } from '@store/uiStore';
import BusinessLogo from '@components/domain/BusinessLogo';
import { useTranslation } from '@/i18n';
import type { AuthStackParamList } from '@tipos/index';

const PIN_LENGTH = 4;
const PIN_STORAGE_KEY = '@interworld:pin';

type Props = NativeStackScreenProps<AuthStackParamList, 'Pin'>;

export default function PinScreen({ navigation, route }: Props): React.ReactElement {
  const mode = (route.params as { mode?: 'verify' | 'set' } | undefined)?.mode ?? 'verify';
  const showToast = useUIStore((s) => s.showToast);
  const { t } = useTranslation();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [biometryIcon, setBiometryIcon] =
    useState<keyof typeof MaterialCommunityIcons.glyphMap>('fingerprint');

  const promptBiometry = useCallback(async (): Promise<void> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('auth.biometryReason'),
        disableDeviceFallback: true,
        cancelLabel: t('common.cancel'),
      });
      if (result.success) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        showToast(t('auth.pinSuccess'), 'success');
        setPin('');
        setError(null);
      }
    } catch {
      // Silencioso: el usuario puede seguir con el PIN
    }
  }, [showToast, t]);

  useEffect(() => {
    if (mode !== 'verify') return;
    let mounted = true;

    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const available = hasHardware && enrolled;
      if (!mounted) return;

      setBiometryAvailable(available);

      if (available) {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (mounted) {
          setBiometryIcon(
            types.includes(
              LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
            )
              ? 'face-recognition'
              : 'fingerprint',
          );
        }
        void promptBiometry();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [mode, promptBiometry]);

  const handleComplete = useCallback(
    async (value: string): Promise<void> => {
      if (mode === 'set') {
        if (confirmPin === null) {
          setConfirmPin(value);
          setPin('');
          setError(null);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return;
        }
        if (confirmPin !== value) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          );
          setError(t('auth.pinMismatch'));
          setPin('');
          setConfirmPin(null);
          return;
        }
        await AsyncStorage.setItem(PIN_STORAGE_KEY, value);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        showToast(t('auth.pinSet'), 'success');
        navigation.goBack();
        return;
      }

      const stored = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      if (!stored) {
        setError(t('auth.pinNotSet'));
        setPin('');
        return;
      }
      if (stored === value) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        showToast(t('auth.pinSuccess'), 'success');
        setPin('');
        // Cuando el PIN se use como pantalla de bloqueo, aquí se desbloquea.
        // Si se usa desde AuthStack, volvemos atrás.
        navigation.goBack();
      } else {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        );
        setError(t('auth.pinWrong'));
        setPin('');
      }
    },
    [mode, confirmPin, navigation, showToast, t],
  );

  const handleDigit = useCallback(
    (digit: string): void => {
      if (pin.length >= PIN_LENGTH) return;
      void Haptics.selectionAsync();
      const next = pin + digit;
      setPin(next);
      setError(null);
      if (next.length === PIN_LENGTH) void handleComplete(next);
    },
    [pin, handleComplete],
  );

  const handleDelete = useCallback((): void => {
    void Haptics.selectionAsync();
    setPin((current) => current.slice(0, -1));
    setError(null);
  }, []);

  const title =
    mode === 'set'
      ? confirmPin === null
        ? t('auth.pinCreateTitle')
        : t('auth.pinConfirmTitle')
      : t('auth.pinTitle');

  const subtitle =
    mode === 'set'
      ? confirmPin === null
        ? t('auth.pinCreateSubtitle')
        : t('auth.pinConfirmSubtitle')
      : t('auth.pinSubtitle');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BusinessLogo size={36} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.dots}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => {
            const filled = index < pin.length;
            return (
              <View
                key={index}
                style={[styles.dot, filled ? styles.dotFilled : null]}
              />
            );
          })}
        </View>

        <View style={styles.messageSlot}>
          {error ? (
            <View style={styles.errorRow}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={14}
                color={colors.danger}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <KeypadKey
            key={digit}
            label={String(digit)}
            onPress={() => handleDigit(String(digit))}
          />
        ))}

        {mode === 'verify' && biometryAvailable ? (
          <KeypadKey
            icon={biometryIcon}
            onPress={promptBiometry}
            accessibilityLabel={t('auth.useBiometry')}
          />
        ) : (
          <View style={styles.keypadKey} />
        )}

        <KeypadKey
          label="0"
          onPress={() => handleDigit('0')}
        />

        <KeypadKey
          icon="backspace-outline"
          onPress={handleDelete}
          disabled={pin.length === 0}
          accessibilityLabel={t('common.delete')}
        />
      </View>

      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.linkButton}
        accessibilityRole="button"
      >
        <Text style={styles.linkText}>{t('auth.usePassword')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function KeypadKey(props: {
  label?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}): React.ReactElement {
  return (
    <Pressable
      onPress={props.disabled ? undefined : props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => [
        styles.keypadKey,
        props.disabled ? styles.keypadKeyDisabled : null,
        pressed && !props.disabled ? styles.keypadKeyPressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? props.label}
    >
      {props.icon ? (
        <MaterialCommunityIcons
          name={props.icon}
          size={24}
          color={colors.textPrimary}
        />
      ) : (
        <Text style={styles.keypadLabel}>{props.label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  messageSlot: {
    minHeight: 24,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: { ...typography.small, color: colors.danger },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  keypadKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keypadKeyPressed: { backgroundColor: colors.surfacePressed },
  keypadKeyDisabled: { opacity: 0.4 },
  keypadLabel: {
    ...typography.h2,
    color: colors.textPrimary,
    fontFamily: typography.bodyBold.fontFamily,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  linkText: {
    ...typography.buttonSmall,
    color: colors.accent,
  },
});