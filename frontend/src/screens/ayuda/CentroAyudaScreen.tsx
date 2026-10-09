import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import type { AppColors } from '@theme/colors';
import { FAQS, CATEGORIAS_FAQ, type FAQ } from '@data/faqs';
import TopBar from '@components/layout/TopBar';
import Chip from '@components/ui/Chip';

export default function CentroAyudaScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<FAQ['categoria'] | 'todas'>('todas');
  const [abierta, setAbierta] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    return FAQS.filter((f) => {
      if (categoria !== 'todas' && f.categoria !== categoria) return false;
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (
        f.pregunta.toLowerCase().includes(q) ||
        f.respuesta.toLowerCase().includes(q)
      );
    });
  }, [busqueda, categoria]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <TopBar title="Centro de ayuda" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.accentSubtle }]}>
            <MaterialCommunityIcons
              name="lifebuoy"
              size={32}
              color={colors.accent}
            />
          </View>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            ¿En qué te ayudamos?
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Encuentra respuestas a las preguntas más frecuentes
          </Text>
        </View>

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={colors.textMuted}
          />
          <TextInput
            placeholder="Buscar pregunta..."
            placeholderTextColor={colors.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {busqueda.length > 0 ? (
            <Pressable onPress={() => setBusqueda('')} hitSlop={8}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          <Chip
            label="Todas"
            active={categoria === 'todas'}
            onPress={() => setCategoria('todas')}
          />
          {CATEGORIAS_FAQ.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              icon={c.icon as never}
              active={categoria === c.value}
              onPress={() => setCategoria(c.value)}
            />
          ))}
        </ScrollView>

        {filtradas.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="magnify-close"
              size={48}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Sin resultados
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Intenta con otras palabras o cambia el filtro
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.listBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {filtradas.map((faq, idx) => {
              const isOpen = abierta === faq.id;
              return (
                <View
                  key={faq.id}
                  style={[
                    styles.faqItem,
                    { borderBottomColor: colors.border },
                    idx === filtradas.length - 1 ? styles.faqItemLast : null,
                  ]}
                >
                  <Pressable
                    onPress={() => setAbierta(isOpen ? null : faq.id)}
                    style={styles.faqHeader}
                  >
                    <Text
                      style={[styles.faqPregunta, { color: colors.textPrimary }]}
                      numberOfLines={isOpen ? 3 : 2}
                    >
                      {faq.pregunta}
                    </Text>
                    <MaterialCommunityIcons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                  {isOpen ? (
                    <View
                      style={[
                        styles.faqRespuestaWrap,
                        { backgroundColor: colors.bgSubtle },
                      ]}
                    >
                      <Text
                        style={[
                          styles.faqRespuesta,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {faq.respuesta}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        <View
          style={[
            styles.contactBox,
            { backgroundColor: colors.accentSubtle },
          ]}
        >
          <MaterialCommunityIcons
            name="message-text-outline"
            size={20}
            color={colors.accent}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactTitle, { color: colors.accentText }]}>
              ¿No encontraste lo que buscabas?
            </Text>
            <Text style={[styles.contactSub, { color: colors.accentText }]}>
              Contacta al desarrollador para soporte adicional.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
    hero: { alignItems: 'center', marginBottom: spacing.xl },
    heroIcon: {
      width: 64,
      height: 64,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    heroTitle: { ...typography.h2 },
    heroSub: {
      ...typography.caption,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 44,
      marginBottom: spacing.md,
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      marginLeft: spacing.sm,
      paddingVertical: 0,
    },
    chipsScroll: { flexGrow: 0, maxHeight: 44, marginBottom: spacing.lg },
    chipsRow: { gap: spacing.sm, alignItems: 'center' },
    listBox: {
      borderRadius: radius.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    faqItem: {
      borderBottomWidth: 1,
    },
    faqItemLast: { borderBottomWidth: 0 },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      gap: spacing.md,
    },
    faqPregunta: {
      ...typography.bodyBold,
      flex: 1,
    },
    faqRespuestaWrap: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    faqRespuesta: {
      ...typography.body,
      lineHeight: 22,
      paddingTop: spacing.md,
    },
    empty: {
      alignItems: 'center',
      paddingVertical: spacing.giant,
      gap: spacing.md,
    },
    emptyTitle: { ...typography.h3 },
    emptySub: {
      ...typography.caption,
      textAlign: 'center',
    },
    contactBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.xl,
    },
    contactTitle: { ...typography.bodyBold },
    contactSub: {
      ...typography.small,
      marginTop: 2,
    },
  });