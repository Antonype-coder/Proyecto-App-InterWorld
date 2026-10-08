import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import Sheet from '@components/ui/Sheet';
import Button from '@components/ui/Button';
import { formatCurrency } from '@utils/format';

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';

interface PaymentSheetProps {
  visible: boolean;
  total: number;
  onClose: () => void;
  onConfirm: (metodo: MetodoPago) => void;
  loading?: boolean;
}

const METODOS: {
  value: MetodoPago;
  label: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  {
    value: 'efectivo',
    label: 'Efectivo',
    description: 'Pago en efectivo físico',
    icon: 'cash',
  },
  {
    value: 'tarjeta',
    label: 'Tarjeta',
    description: 'Débito o crédito',
    icon: 'credit-card-outline',
  },
  {
    value: 'transferencia',
    label: 'Transferencia',
    description: 'Pago por transferencia bancaria',
    icon: 'bank-transfer',
  },
  {
    value: 'otro',
    label: 'Otro',
    description: 'Nequi, Daviplata u otro',
    icon: 'dots-horizontal',
  },
];

export default function PaymentSheet({
  visible,
  total,
  onClose,
  onConfirm,
  loading = false,
}: PaymentSheetProps): React.ReactElement {
  const colors = useColors();
  const [selected, setSelected] = useState<MetodoPago>('efectivo');

  return (
    <Sheet visible={visible} onClose={onClose} title="Método de pago">
      {/* Total a cobrar */}
      <View
        style={[
          styles.totalBox,
          {
            backgroundColor: colors.bgSubtle,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.totalLabel, { color: colors.textMuted }]}>
          Total a cobrar
        </Text>
        <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
          {formatCurrency(total)}
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        ELIGE EL MÉTODO
      </Text>

      <View style={styles.list}>
        {METODOS.map((m, idx) => {
          const active = selected === m.value;
          return (
            <Pressable
              key={m.value}
              onPress={() => setSelected(m.value)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: active
                    ? colors.accentSubtle
                    : colors.surface,
                  borderColor: active ? colors.accent : colors.border,
                },
                idx === METODOS.length - 1 ? styles.rowLast : null,
                pressed ? { opacity: 0.9 } : null,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: active
                      ? colors.accent
                      : colors.bgSubtle,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={m.icon}
                  size={20}
                  color={active ? colors.textInverse : colors.textSecondary}
                />
              </View>

              <View style={styles.info}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: active
                        ? colors.accentText
                        : colors.textPrimary,
                    },
                  ]}
                >
                  {m.label}
                </Text>
                <Text
                  style={[
                    styles.description,
                    { color: colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {m.description}
                </Text>
              </View>

              <View
                style={[
                  styles.radio,
                  {
                    borderColor: active
                      ? colors.accent
                      : colors.borderStrong,
                  },
                ]}
              >
                {active ? (
                  <View
                    style={[
                      styles.radioDot,
                      { backgroundColor: colors.accent },
                    ]}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button
          label={`Cobrar ${formatCurrency(total)}`}
          onPress={() => onConfirm(selected)}
          loading={loading}
          disabled={loading}
          variant="primary"
          size="lg"
          icon="check-circle-outline"
          fullWidth
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  totalBox: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  totalLabel: { ...typography.small },
  totalValue: {
    ...typography.display,
    marginTop: 4,
    letterSpacing: -0.8,
  },
  sectionLabel: {
    ...typography.overline,
    marginBottom: spacing.sm,
  },
  list: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    minHeight: 64,
  },
  rowLast: {},
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  label: { ...typography.bodyBold },
  description: { ...typography.small, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actions: {
    marginTop: spacing.xl,
  },
});