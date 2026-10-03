import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '@theme/index';

interface TooltipProps {
  text: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title?: string;
}

export default function Tooltip({
  text,
  icon = 'help-circle-outline',
  title,
}: TooltipProps): React.ReactElement {
  const [visible, setVisible] = useState(false);
  const { width } = Dimensions.get('window');

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        hitSlop={10}
        style={styles.trigger}
      >
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={colors.textMuted}
        />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={[styles.tooltip, { maxWidth: width - spacing.lg * 4 }]}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <Text style={styles.text}>{text}</Text>
            <Pressable
              onPress={() => setVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>Entendido</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: 2,
    marginLeft: spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  tooltip: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.xl,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  closeBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignSelf: 'flex-end',
  },
  closeText: {
    ...typography.button,
    color: colors.textInverse,
  },
});