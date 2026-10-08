import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, typography, radius } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Button from '@components/ui/Button';

interface ErrorStateProps {
  title?: string;
  /** Mensaje humano y claro. Ej: "No pudimos conectar con el servidor." */
  message?: string;
  /** Error técnico crudo. Se muestra bajo un botón "Ver detalles". */
  technicalMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

export default function ErrorState({
  title = 'Algo salió mal',
  message = 'No pudimos completar la operación. Intenta de nuevo.',
  technicalMessage,
  onRetry,
  retryLabel = 'Reintentar',
  style,
}: ErrorStateProps): React.ReactElement {
  const colors = useColors();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.dangerSubtle },
        ]}
      >
        <MaterialCommunityIcons
          name="alert-octagon-outline"
          size={32}
          color={colors.danger}
        />
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>

      {onRetry ? (
        <View style={styles.action}>
          <Button
            label={retryLabel}
            onPress={onRetry}
            variant="primary"
            icon="refresh"
            fullWidth
          />
        </View>
      ) : null}

      {technicalMessage ? (
        <Pressable
          onPress={() => setShowDetails((v) => !v)}
          style={styles.detailsToggle}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name={showDetails ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.textMuted}
          />
          <Text style={[styles.detailsToggleText, { color: colors.textMuted }]}>
            {showDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}
          </Text>
        </Pressable>
      ) : null}

      {showDetails && technicalMessage ? (
        <View
          style={[
            styles.detailsBox,
            {
              backgroundColor: colors.bgSubtle,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[styles.detailsText, { color: colors.textSecondary }]}
            selectable
          >
            {technicalMessage}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
    paddingHorizontal: spacing.xxl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  action: {
    marginTop: spacing.xl,
    width: '100%',
    maxWidth: 240,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.lg,
  },
  detailsToggleText: { ...typography.small },
  detailsBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    maxWidth: 340,
    width: '100%',
  },
  detailsText: {
    ...typography.small,
    lineHeight: 18,
  },
});