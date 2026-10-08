import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface TagProps {
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function Tag({
  label,
  icon,
  color,
  style,
}: TagProps): React.ReactElement {
  const colors = useColors();
  const fg = color ?? colors.textSecondary;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.bgSubtle,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={12}
          color={fg}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  icon: { marginRight: 4 },
  label: { ...typography.small },
});