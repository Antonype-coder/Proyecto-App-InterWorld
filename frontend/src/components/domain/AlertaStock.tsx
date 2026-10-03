import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@theme/index';

interface AlertaStockProps {
  cantidad: number;
  onPress?: () => void;
}

export default function AlertaStock({
  cantidad,
  onPress,
}: AlertaStockProps): React.ReactElement {
  const text =
    cantidad === 1
      ? '1 producto con stock bajo'
      : `${cantidad} productos con stock bajo`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed ? styles.pressed : null]}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name="alert-outline"
          size={18}
          color={colors.warningText}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Stock bajo</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
      {onPress ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={colors.textMuted}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSubtle,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: { opacity: 0.8 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: { flex: 1 },
  title: { ...typography.bodyBold, color: colors.warningText },
  text: { ...typography.small, color: colors.warningText, marginTop: 2 },
});