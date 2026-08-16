import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useAppTheme } from '@/shared/theme';

type Props = Omit<TextInputProps, 'style'> & { label?: string; error?: string; wrapperStyle?: object };

export function AppTextInput({ label, error, wrapperStyle, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        placeholderTextColor={props.placeholderTextColor ?? theme.colors.accent}
        style={[styles.input, focused && styles.inputFocused, !!error && styles.inputError]}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  wrapper: { width: '100%', marginBottom: theme.spacing.sm },
  label: { color: theme.colors.accent, fontSize: theme.fontSize.sm, fontWeight: '600', marginBottom: theme.spacing.xs },
  input: { minHeight: 44, backgroundColor: theme.colors.input, color: theme.colors.text, borderRadius: theme.radius.input, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, fontSize: theme.fontSize.sm },
  inputFocused: { borderColor: theme.colors.borderFocused, backgroundColor: theme.colors.inputFocused, shadowColor: theme.colors.accent, shadowOpacity: 0.2, shadowRadius: 6, elevation: 2 },
  inputError: { borderColor: theme.colors.error, backgroundColor: theme.colors.errorBg },
  error: { color: theme.colors.error, fontSize: theme.fontSize.xs, marginTop: 4, marginLeft: 4 },
  });
}


