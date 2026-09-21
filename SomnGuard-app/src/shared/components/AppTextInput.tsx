import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useAppTheme } from '@/shared/theme';

type Props = Omit<TextInputProps, 'style'> & { label?: string; error?: string; wrapperStyle?: object };

export function AppTextInput({ label, error, wrapperStyle, secureTextEntry, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const isPassword = !!secureTextEntry;
  const actuallySecure = isPassword && !visible;

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, focused && styles.inputContainerFocused, !!error && styles.inputContainerError]}>
        <TextInput
          {...props}
          secureTextEntry={actuallySecure}
          placeholderTextColor={props.placeholderTextColor ?? theme.colors.placeholder}
          style={[styles.input, !!error && styles.inputErrorText]}
          onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
        />
        {isPassword && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setVisible((v) => !v)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  wrapper: { width: '100%', marginBottom: theme.spacing.sm },
  label: { color: theme.colors.accent, fontSize: theme.fontSize.sm, fontWeight: '600', marginBottom: theme.spacing.xs },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 2,
  },
  inputContainerFocused: { borderColor: theme.colors.borderFocused, backgroundColor: theme.colors.inputFocused },
  inputContainerError: { borderColor: theme.colors.error, backgroundColor: theme.colors.errorBg },
  input: { flex: 1, color: theme.colors.text, fontSize: theme.fontSize.sm, paddingVertical: theme.spacing.sm, paddingHorizontal: 0 },
  inputErrorText: {},
  error: { color: theme.colors.error, fontSize: theme.fontSize.xs, marginTop: 4, marginLeft: 4 },
  eyeButton: { padding: 6, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  });
}

