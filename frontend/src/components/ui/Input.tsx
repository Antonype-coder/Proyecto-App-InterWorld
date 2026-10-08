import React, { forwardRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@theme/index';
import { useColors } from '@hooks/useColors';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
}

const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helper,
    icon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    required = false,
    value,
    editable = true,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  const isPassword = rest.secureTextEntry === true;
  const showAsPassword = isPassword && !visible;
  const hasError = Boolean(error);

  const borderColor = hasError
    ? colors.danger
    : focused
      ? colors.primary
      : colors.borderStrong;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {label}
          </Text>
          {required ? (
            <Text style={[styles.required, { color: colors.danger }]}>*</Text>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: editable ? colors.surface : colors.bgSubtle,
            borderColor,
          },
          focused ? styles.inputWrapperFocused : null,
          !editable ? styles.inputWrapperDisabled : null,
        ]}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={focused ? colors.textPrimary : colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          ref={ref}
          {...rest}
          value={value}
          editable={editable}
          secureTextEntry={showAsPassword}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { color: colors.textPrimary },
            icon ? styles.inputWithIcon : null,
          ]}
          accessibilityLabel={label}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            style={styles.rightAction}
            accessibilityLabel={
              visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
          >
            <MaterialCommunityIcons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}

        {!isPassword && rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            hitSlop={8}
            style={styles.rightAction}
            accessibilityLabel="Acción"
          >
            <MaterialCommunityIcons
              name={rightIcon}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      {hasError ? (
        <View style={styles.messageRow}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={14}
            color={colors.danger}
          />
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={[styles.helper, { color: colors.textMuted }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
});

export default Input;

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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  inputWrapperFocused: { borderWidth: 1.5 },
  inputWrapperDisabled: { opacity: 0.6 },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.md,
  },
  inputWithIcon: { paddingLeft: spacing.sm },
  leftIcon: { marginRight: spacing.xs },
  rightAction: { padding: spacing.xs, marginLeft: spacing.xs },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  error: { ...typography.small },
  helper: {
    ...typography.small,
    marginTop: spacing.sm,
  },
});