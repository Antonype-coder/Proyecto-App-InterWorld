import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  Edge,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { spacing } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useKeyboardVisible } from '@hooks/useKeyboardVisible';

const TAB_BAR_HEIGHT = 56;

interface KeyboardScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  /** Contenido fijo abajo, arriba de la tab bar. Ideal para el botón principal. */
  footer?: React.ReactNode;
  edges?: Edge[];
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
}

export default function KeyboardScreen({
  children,
  header,
  footer,
  edges = ['top'],
  scrollable = true,
  contentContainerStyle,
}: KeyboardScreenProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const keyboardVisible = useKeyboardVisible();

  // Con teclado abierto: solo un padding chico (la tab bar está tapada).
  // Sin teclado: reservamos insets + tab bar para que el footer quede arriba.
  const footerBottomPadding = keyboardVisible
    ? spacing.md
    : insets.bottom + TAB_BAR_HEIGHT + spacing.md;

  const scrollBottomPadding = footer
    ? spacing.lg
    : insets.bottom + TAB_BAR_HEIGHT + spacing.giant;

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: scrollBottomPadding },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={edges}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        {header}
        {content}

        {footer ? (
          <View
            style={[
              styles.footer,
              {
                paddingBottom: footerBottomPadding,
                backgroundColor: colors.bg,
              },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  footer: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});