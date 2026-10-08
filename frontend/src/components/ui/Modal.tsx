import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography, shadows } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
  footer,
  scrollable = false,
}: ModalProps): React.ReactElement {
  const colors = useColors();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.content,
            {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            },
            shadows.xl,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {title ? (
            <View
              style={[styles.header, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          ) : null}

          {scrollable ? (
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}

          {footer ? (
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: colors.border,
                  backgroundColor: colors.bgSubtle,
                },
              ]}
            >
              {footer}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    ...typography.h3,
    flex: 1,
  },
  closeButton: { padding: spacing.xs, marginLeft: spacing.sm },
  body: { maxHeight: '100%' },
  bodyContent: { padding: spacing.xl },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
  },
});