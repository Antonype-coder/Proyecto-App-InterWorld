import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { spacing, radius, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { usuariosApi } from '@api/index';
import type { Usuario, UsuariosStackParamList } from '@tipos/index';
import { ROL_LABEL } from '@utils/constants';
import Badge from '@components/ui/Badge';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import Loader from '@components/ui/Loader';
import ErrorState from '@components/feedback/ErrorState';
import TopBar from '@components/layout/TopBar';
import { useConfirm } from '@components/feedback/ConfirmProvider';
import { useUIStore } from '@store/uiStore';

type Params = RouteProp<UsuariosStackParamList, 'UsuarioDetalle'>;

export function UsuarioDetalleScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const route = useRoute<Params>();
  const userId = route.params.userId;
  const colors = useColors();
  const confirm = useConfirm();
  const showToast = useUIStore((s) => s.showToast);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const u = await usuariosApi.obtener(userId);
      setUsuario(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar usuario');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const desactivar = async (): Promise<void> => {
    const ok = await confirm({
      title: 'Desactivar usuario',
      message:
        'El usuario no podrá iniciar sesión. Puedes reactivarlo cuando quieras.',
      confirmLabel: 'Desactivar',
      variant: 'warning',
    });
    if (!ok) return;

    try {
      await usuariosApi.eliminar(userId);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      showToast('Usuario desactivado.', 'success');
      navigation.goBack();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : 'Error al desactivar';
      showToast(msg, 'error');
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['top']}
      >
        <TopBar
          title="Usuario"
          onBack={() => navigation.goBack()}
        />
        <Loader message="Cargando usuario" />
      </SafeAreaView>
    );
  }

  if (error || !usuario) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['top']}
      >
        <TopBar
          title="Usuario"
          onBack={() => navigation.goBack()}
        />
        <ErrorState
          title="No pudimos cargar el usuario"
          message="Revisa tu conexión e intenta de nuevo."
          technicalMessage={error ?? undefined}
          onRetry={cargar}
        />
      </SafeAreaView>
    );
  }

  const activo = usuario.activo === 1;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <TopBar
        title="Usuario"
        onBack={() => navigation.goBack()}
        rightIcon="pencil-outline"
        onRightPress={() =>
          navigation.navigate('UsuarioForm', { userId })
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.textInverse }]}>
              {usuario.nombre
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </Text>
          </View>

          <Text style={[styles.nombre, { color: colors.textPrimary }]}>
            {usuario.nombre}
          </Text>
          <Text style={[styles.email, { color: colors.textMuted }]}>
            {usuario.email}
          </Text>

          <View style={styles.badgeRow}>
            <Badge
              label={ROL_LABEL[usuario.rol] ?? usuario.rol}
              variant={usuario.rol === 'admin' ? 'info' : 'neutral'}
            />
            <Badge
              label={activo ? 'Activo' : 'Inactivo'}
              variant={activo ? 'success' : 'neutral'}
            />
          </View>
        </View>

        <Card variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Información
          </Text>

          <InfoRow
            icon="account-outline"
            label="Nombre"
            value={usuario.nombre}
          />
          <InfoRow
            icon="email-outline"
            label="Correo"
            value={usuario.email}
          />
          <InfoRow
            icon="shield-account-outline"
            label="Rol"
            value={ROL_LABEL[usuario.rol] ?? usuario.rol}
          />
          <InfoRow
            icon="check-circle-outline"
            label="Estado"
            value={activo ? 'Activo' : 'Inactivo'}
          />
        </Card>

        {activo ? (
          <Button
            label="Desactivar usuario"
            variant="danger"
            icon="account-off-outline"
            onPress={() => {
              void desactivar();
            }}
            fullWidth
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default UsuarioDetalleScreen;

function InfoRow(props: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}): React.ReactElement {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
      <MaterialCommunityIcons
        name={props.icon}
        size={16}
        color={colors.textMuted}
      />
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
          {props.label}
        </Text>
        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
          {props.value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.giant,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.h1,
    fontWeight: '700',
  },
  nombre: {
    ...typography.h2,
    textAlign: 'center',
  },
  email: {
    ...typography.caption,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  infoText: { flex: 1 },
  infoLabel: { ...typography.small },
  infoValue: { ...typography.body, marginTop: 2 },
});