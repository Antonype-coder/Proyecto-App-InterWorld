import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Modal from '../ui/Modal';
import { colors, radius, spacing, typography } from '@theme/index';

interface PickerOption {
  id: number;
  nombre: string;
  subtitle?: string;
}

interface FormSearchPickerProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  options: PickerOption[];
  required?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  helper?: string;
}

export default function FormSearchPicker<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Seleccionar',
  options,
  required,
  icon,
  helper,
}: FormSearchPickerProps<T>): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const filtered = useMemo(() => {
    if (!busqueda) return options;
    const q = busqueda.toLowerCase();
    return options.filter((o) => o.nombre.toLowerCase().includes(q));
  }, [options, busqueda]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const selected = options.find((o) => o.id === value);

        return (
          <>
            <View style={styles.container}>
              {label ? (
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{label}</Text>
                  {required ? <Text style={styles.required}>*</Text> : null}
                </View>
              ) : null}

              <Pressable
                onPress={() => setOpen(true)}
                style={[
                  styles.selectBox,
                  error ? styles.selectBoxError : null,
                ]}
              >
                {icon ? (
                  <MaterialCommunityIcons
                    name={icon}
                    size={18}
                    color={colors.textMuted}
                    style={styles.selectIcon}
                  />
                ) : null}

                <View style={styles.selectText}>
                  <Text
                    style={selected ? styles.selectValue : styles.selectPlaceholder}
                    numberOfLines={1}
                  >
                    {selected ? selected.nombre : placeholder}
                  </Text>
                  {selected?.subtitle ? (
                    <Text style={styles.selectSub} numberOfLines={1}>
                      {selected.subtitle}
                    </Text>
                  ) : null}
                </View>

                <MaterialCommunityIcons
                  name="chevron-down"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              {error?.message ? (
                <Text style={styles.error}>{error.message}</Text>
              ) : helper ? (
                <Text style={styles.helper}>{helper}</Text>
              ) : null}
            </View>

            <Modal
              visible={open}
              onClose={() => setOpen(false)}
              title={`Seleccionar ${label.toLowerCase()}`}
              scrollable
            >
              <View style={styles.searchBox}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={18}
                  color={colors.textMuted}
                />
                <TextInput
                  placeholder="Buscar..."
                  placeholderTextColor={colors.textMuted}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  style={styles.searchInput}
                />
              </View>

              <FlatList
                data={filtered}
                keyExtractor={(item) => String(item.id)}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <Pressable
                    onPress={() => {
                      onChange(item.id);
                      setOpen(false);
                      setBusqueda('');
                    }}
                    style={({ pressed }) => [
                      styles.optionRow,
                      index === filtered.length - 1 ? styles.optionRowLast : null,
                      pressed ? styles.optionRowPressed : null,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionName}>{item.nombre}</Text>
                      {item.subtitle ? (
                        <Text style={styles.optionSub}>{item.subtitle}</Text>
                      ) : null}
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={colors.textMuted}
                    />
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Sin resultados</Text>
                }
              />
            </Modal>
          </>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: { ...typography.bodyBold, color: colors.textPrimary },
  required: {
    ...typography.bodyBold,
    color: colors.danger,
    marginLeft: 3,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  selectBoxError: { borderColor: colors.danger },
  selectIcon: { marginRight: spacing.sm },
  selectText: { flex: 1 },
  selectPlaceholder: { ...typography.body, color: colors.textMuted },
  selectValue: { ...typography.body, color: colors.textPrimary },
  selectSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.sm },
  helper: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionRowLast: { borderBottomWidth: 0 },
  optionRowPressed: { opacity: 0.6 },
  optionName: { ...typography.bodyBold, color: colors.textPrimary },
  optionSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});