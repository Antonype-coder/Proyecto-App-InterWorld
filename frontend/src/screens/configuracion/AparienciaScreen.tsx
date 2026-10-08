import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { spacing, radius, typography } from '@theme/index';
import { useUIStore, type ThemePreference } from '@store/uiStore';
import { useTheme } from '@hooks/useTheme';
import { useColors } from '@hooks/useColors';
import AppHeader from '@components/layout/AppHeader';
import RadioGroup, { type RadioOption } from '@components/ui/RadioGroup';
import Badge from '@components/ui/Badge';
import { StaggeredSection } from '@components/animations';

export default function AparienciaScreen(): React.ReactElement {
  const { preference, mode, setThemeMode } = useTheme();
  const colors = useColors();
  const showToast = useUIStore((s) => s.showToast);

  const options: RadioOption<ThemePreference>[] = [
    {
      value: 'system',
      label: 'Sistema',
      description: 'Sigue la preferencia de tu dispositivo',
    },
    {
      value: 'light',
      label: 'Claro',
      description: 'Fondo claro y texto oscuro',
    },
    {
      value: 'dark',
      label: 'Oscuro',
      description: 'Fondo oscuro y texto claro',
    },
  ];

  const handleChange = (value: ThemePreference): void => {
    void Haptics.selectionAsync();
    setThemeMode(value);
    showToast(
      value === 'system'
        ? 'Apariencia siguiendo el sistema.'
        : value === 'dark'
          ? 'Tema oscuro activado.'
          : 'Tema claro activado.',
      'success',
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <AppHeader showSearch={false} showNotifications={false} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <StaggeredSection delay={0}>
          <View
            style={[
              styles.preview,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.previewHeader}>
              <Text
                style={[styles.previewLabel, { color: colors.textMuted }]}
              >
                VISTA PREVIA
              </Text>
              <Badge
                label={mode === 'dark' ? 'Oscuro' : 'Claro'}
                variant="accent"
                size="sm"
              />
            </View>

            <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>
              Panel de control
            </Text>
            <Text
              style={[styles.previewSubtitle, { color: colors.textSecondary }]}
            >
              Así se verán los textos y superficies en el tema activo.
            </Text>

            <View style={styles.previewGrid}>
              <PreviewCard
                label="Superficie"
                bg={colors.bgSubtle}
                textColor={colors.textPrimary}
                borderColor={colors.border}
              />
              <PreviewCard
                label="Acento"
                bg={colors.accentSubtle}
                textColor={colors.accentText}
                borderColor={colors.accent}
              />
              <PreviewCard
                label="Éxito"
                bg={colors.successSubtle}
                textColor={colors.successText}
                borderColor={colors.success}
              />
              <PreviewCard
                label="Peligro"
                bg={colors.dangerSubtle}
                textColor={colors.dangerText}
                borderColor={colors.danger}
              />
            </View>

            <View
              style={[styles.previewButton, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons
                name="check"
                size={16}
                color={colors.textInverse}
              />
              <Text
                style={[styles.previewButtonText, { color: colors.textInverse }]}
              >
                Botón principal
              </Text>
            </View>
          </View>
        </StaggeredSection>

        <StaggeredSection delay={120}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            APARIENCIA
          </Text>
          <View style={styles.sectionBody}>
            <RadioGroup<ThemePreference>
              value={preference}
              onChange={handleChange}
              options={options}
            />
          </View>
        </StaggeredSection>

        <StaggeredSection delay={240}>
          <View
            style={[
              styles.note,
              { backgroundColor: colors.infoSubtle, borderColor: colors.info },
            ]}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={colors.info}
              style={styles.noteIcon}
            />
            <Text style={[styles.noteText, { color: colors.infoText }]}>
              El tema se aplica al instante en esta vista previa y en toda la
              app.
            </Text>
          </View>
        </StaggeredSection>

        <View style={{ height: spacing.giant }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PreviewCard(props: {
  label: string;
  bg: string;
  textColor: string;
  borderColor: string;
}): React.ReactElement {
  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.previewCard,
          {
            backgroundColor: props.bg,
            borderColor: props.borderColor,
            transform: [{ scale }],
          },
        ]}
      >
        <Text style={[styles.previewCardText, { color: props.textColor }]}>
          {props.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: spacing.giant },

  preview: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  previewLabel: { ...typography.overline },
  previewTitle: { ...typography.h3 },
  previewSubtitle: {
    ...typography.caption,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  previewCard: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  previewCardText: {
    ...typography.small,
    fontFamily: typography.button.fontFamily,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 40,
    borderRadius: radius.md,
  },
  previewButtonText: { ...typography.button },

  sectionLabel: {
    ...typography.overline,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },

  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  noteIcon: { marginTop: 1 },
  noteText: {
    ...typography.caption,
    flex: 1,
    lineHeight: 20,
  },
});