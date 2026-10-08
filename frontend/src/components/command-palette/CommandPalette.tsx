import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Modal from '@components/ui/Modal';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import { useCommands, type Command } from './useCommands';

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
}

export default function CommandPalette({
  visible,
  onClose,
}: CommandPaletteProps): React.ReactElement {
  const colors = useColors();
  const commands = useCommands();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [visible]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q),
    );
  }, [commands, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Command[]>();
    for (const c of filtered) {
      if (!groups.has(c.group)) groups.set(c.group, []);
      groups.get(c.group)!.push(c);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const flat = useMemo(() => {
    const items: Command[] = [];
    for (const [, cmds] of grouped) {
      for (const c of cmds) items.push(c);
    }
    return items;
  }, [grouped]);

  const runCommand = (cmd: Command) => {
    Keyboard.dismiss();
    onClose();
    setTimeout(() => cmd.run(), 120);
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      scrollable={false}
    >
      <View style={styles.container}>
        {/* Search input */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.bgSubtle, borderColor: colors.border },
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={colors.textMuted}
          />
          <TextInput
            ref={inputRef}
            placeholder="Buscar un comando..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={() => {
              if (flat[highlight]) runCommand(flat[highlight]);
            }}
          />
          {Platform.OS === 'web' ? (
            <View
              style={[
                styles.kbd,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.kbdText, { color: colors.textMuted }]}>
                ESC
              </Text>
            </View>
          ) : null}
        </View>

        {/* Results */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="magnify-close"
              size={32}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Sin resultados para "{query}"
            </Text>
          </View>
        ) : (
          <FlatList
            data={grouped}
            keyExtractor={([group]) => group}
            showsVerticalScrollIndicator={false}
            style={styles.list}
            renderItem={({ item: [group, cmds] }) => (
              <View style={styles.group}>
                <Text
                  style={[styles.groupLabel, { color: colors.textMuted }]}
                >
                  {group.toUpperCase()}
                </Text>
                {cmds.map((cmd) => {
                  const idx = flat.indexOf(cmd);
                  const isHighlight = idx === highlight;
                  return (
                    <Pressable
                      key={cmd.id}
                      onPress={() => runCommand(cmd)}
                      onHoverIn={() => setHighlight(idx)}
                      style={({ pressed }) => [
                        styles.row,
                        isHighlight
                          ? { backgroundColor: colors.surfacePressed }
                          : pressed
                            ? { backgroundColor: colors.surfacePressed }
                            : null,
                      ]}
                    >
                      <View
                        style={[
                          styles.iconWrap,
                          { backgroundColor: colors.bgSubtle },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={cmd.icon}
                          size={16}
                          color={colors.textSecondary}
                        />
                      </View>
                      <View style={styles.info}>
                        <Text
                          style={[styles.label, { color: colors.textPrimary }]}
                          numberOfLines={1}
                        >
                          {cmd.label}
                        </Text>
                        {cmd.description ? (
                          <Text
                            style={[
                              styles.description,
                              { color: colors.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            {cmd.description}
                          </Text>
                        ) : null}
                      </View>
                      {cmd.shortcut ? (
                        <View
                          style={[
                            styles.kbd,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.kbdText, { color: colors.textMuted }]}
                          >
                            {cmd.shortcut}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 200,
    maxHeight: 480,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: 0,
  },
  list: { flexGrow: 0 },
  group: { marginBottom: spacing.lg },
  groupLabel: {
    ...typography.overline,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  label: { ...typography.bodyBold },
  description: { ...typography.small, marginTop: 1 },
  kbd: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    minWidth: 24,
    alignItems: 'center',
  },
  kbdText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 10,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: { ...typography.caption },
});