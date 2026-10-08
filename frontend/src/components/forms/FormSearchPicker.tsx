import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Modal from '../ui/Modal';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';

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
  const colors = useColors();
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
                  <Text style={[styles.label, { color: colors.textPrimary }]}>
                    {label}
                  </Text>
                  {required ? (
                    <Text
                      style={[styles.required, { color: colors.danger }]}
                    >
                      *
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <Pressable
                onPress={() => setOpen(true)}
                style={[
                  styles.selectBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: error ? colors.danger : colors.borderStrong,
                  },
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
                    style={[
                      selected ? styles.selectValue : styles.selectPlaceholder,
                      {
                        color: selected
                          ? colors.textPrimary
                          : colors.textMuted,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {selected ? selected.nombre : placeholder}
                  </Text>
                  {selected?.subtitle ? (
                    <Text
                      style={[styles.selectSub, { color: colors.textMuted }]}
                      numberOfLines={1}
                    >
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
                <Text style={[styles.error, { color: colors.danger }]}>
                  {error.message}
                </Text>
              ) : helper ? (
                <Text style={[styles.helper, { color: colors.textMuted }]}>
                  {helper}
                </Text>
              ) : null}
            </View>

            <Modal
              visible={open}
              onClose={() => setOpen(false)}
              title={`Seleccionar ${label.toLowerCase()}`}
              scrollable
            >
              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: colors.bgSubtle },
                ]}
              >
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
                  style={[
                    styles.searchInput,
                    { color: colors.textPrimary },
                  ]}
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
                      { borderBottomColor: colors.border },
                      index === filtered.length - 1
                        ? styles.optionRowLast
                        : null,
                      pressed ? styles.optionRowPressed : null,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionName,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {item.nombre}
                      </Text>
                      {item.subtitle ? (
                        <Text
                          style={[
                            styles.optionSub,
                            { color: colors.textMuted },
                          ]}
                        >
                          {item.subtitle}
                        </Text>
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
                  <Text
                    style={[styles.emptyText, { color: colors.textMuted }]}
                  >
                    Sin resultados
                  </Text>
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
  label: { ...typography.bodyBold },
  required: {
    ...typography.bodyBold,
    marginLeft: 3,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  selectIcon: { marginRight: spacing.sm },
  selectText: { flex: 1 },
  selectPlaceholder: { ...typography.body },
  selectValue: { ...typography.body },
  selectSub: { ...typography.small, marginTop: 2 },
  error: { ...typography.small, marginTop: spacing.sm },
  helper: { ...typography.small, marginTop: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  optionRowLast: { borderBottomWidth: 0 },
  optionRowPressed: { opacity: 0.6 },
  optionName: { ...typography.bodyBold },
  optionSub: { ...typography.small, marginTop: 2 },
  emptyText: {
    ...typography.caption,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});