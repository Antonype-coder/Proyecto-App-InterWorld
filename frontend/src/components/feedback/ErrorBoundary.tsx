import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@theme/index';
import Button from '@components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Captura errores de render en el árbol hijo.
 * Nota: al ser un class component no puede usar hooks, por eso
 * usa los colores estáticos del tema claro. Los componentes hijos
 * sí respetan el tema activo.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    const { error } = this.state;

    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.reset);
      }

      return (
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="alert-octagon-outline"
              size={32}
              color={colors.danger}
            />
          </View>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.description}>
            Ocurrió un error inesperado. Puedes intentar de nuevo.
          </Text>
          <View style={styles.actions}>
            <Button
              label="Reintentar"
              icon="refresh"
              variant="primary"
              onPress={this.reset}
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.bg,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  actions: {
    marginTop: spacing.xl,
    minWidth: 180,
  },
});