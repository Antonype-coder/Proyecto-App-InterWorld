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

import { colors, radius, spacing, typography } from '@theme/index';
import { FAQS, CATEGORIAS_FAQ, type FAQ } from '@data/faqs';
import TopBar from '@components/layout/TopBar';
import Chip from '@components/ui/Chip';

export default function CentroAyudaScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="Centro de ayuda" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header con icono */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="lifebuoy"
              size={32}
              color={colors.accent}
            />
          </View>
          <Text style={styles.heroTitle}>¿En qué te ayudamos?</Text>
          <Text style={styles.heroSub}>
            Encuentra respuestas a las preguntas más frecuentes
          </Text>
        </View>

        {/* Buscador */}
        <View style={styles.searchBox}>
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
            style={styles.searchInput}
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

        {/* Filtros por categoría */}
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

        {/* Lista de FAQs */}
        {filtradas.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="magnify-close"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptySub}>
              Intenta con otras palabras o cambia el filtro
            </Text>
          </View>
        ) : (
          <View style={styles.listBox}>
            {filtradas.map((faq, idx) => {
              const isOpen = abierta === faq.id;
              return (
                <View
                  key={faq.id}
                  style={[
                    styles.faqItem,
                    idx === filtradas.length - 1 ? styles.faqItemLast : null,
                  ]}
                >
                  <Pressable
                    onPress={() => setAbierta(isOpen ? null : faq.id)}
                    style={styles.faqHeader}
                  >
                    <Text style={styles.faqPregunta} numberOfLines={isOpen ? 3 : 2}>
                      {faq.pregunta}
                    </Text>
                    <MaterialCommunityIcons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                  {isOpen ? (
                    <View style={styles.faqRespuestaWrap}>
                      <Text style={styles.faqRespuesta}>{faq.respuesta}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* Contacto */}
        <View style={styles.contactBox}>
          <MaterialCommunityIcons
            name="message-text-outline"
            size={20}
            color={colors.accent}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>¿No encontraste lo que buscabas?</Text>
            <Text style={styles.contactSub}>
              Contacta al desarrollador para soporte adicional.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.giant },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: { ...typography.h2, color: colors.textPrimary },
  heroSub: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  chipsScroll: { flexGrow: 0, maxHeight: 44, marginBottom: spacing.lg },
  chipsRow: { gap: spacing.sm, alignItems: 'center' },
  listBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textPrimary,
    flex: 1,
  },
  faqRespuestaWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgSubtle,
  },
  faqRespuesta: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    paddingTop: spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.giant,
    gap: spacing.md,
  },
  emptyTitle: { ...typography.h3, color: colors.textPrimary },
  emptySub: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  contactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  contactTitle: { ...typography.bodyBold, color: colors.accentText },
  contactSub: {
    ...typography.small,
    color: colors.accentText,
    marginTop: 2,
  },
});