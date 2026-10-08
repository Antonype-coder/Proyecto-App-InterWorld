import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface AlertaStockProps {
  cantidad: number;
  onPress: () => void;
}

export default function AlertaStock({
  cantidad,
  onPress,
}: AlertaStockProps): React.ReactElement {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.chartWineSubtle,
          borderColor: colors.chartWine,
        },
        pressed ? { opacity: 0.92 } : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${cantidad} productos con stock bajo`}
    >
      <View
        style={[styles.iconWrap, { backgroundColor: colors.surface }]}
      >
        <MaterialCommunityIcons
          name="alert-outline"
          size={20}
          color={colors.chartWine}
        />
      </View>

      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.chartWine }]}>
          {cantidad} {cantidad === 1 ? 'producto' : 'productos'} con stock bajo
        </Text>
        <Text style={[styles.sub, { color: colors.chartWine, opacity: 0.75 }]}>
          Revisa el inventario para reponer
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.chartWine}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  title: { ...typography.bodyBold },
  sub: { ...typography.small, marginTop: 2 },
});