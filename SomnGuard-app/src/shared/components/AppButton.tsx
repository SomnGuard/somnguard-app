import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '@/shared/theme';
import { ButtonColors } from '@/shared/theme/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger' | 'confirm' | 'cancel' | 'delete' | 'edit' | 'continue' | 'close' | 'disabled';
  disabled?: boolean;
};

export function AppButton({ title, onPress, variant = 'primary', disabled = false }: Props) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const effectiveVariant = disabled ? 'disabled' : variant;
  const isOutline = effectiveVariant === 'outline';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [styles.base, styles[effectiveVariant], pressed && !disabled && styles.pressed, disabled && styles.disabledOpacity]}
      onPress={onPress}
    >
      <Text style={[styles.text, isOutline && styles.outlineText, effectiveVariant === 'disabled' && styles.disabledText]}>{title}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  base: { minHeight: 43, borderRadius: theme.radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, width: '100%' },
  primary: { backgroundColor: theme.colors.accent },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.accent },
  danger: { backgroundColor: 'rgba(204,51,51,0.15)', borderWidth: 1, borderColor: 'rgba(204,51,51,0.45)' },
  confirm: { backgroundColor: ButtonColors.confirm },
  cancel: { backgroundColor: ButtonColors.cancel },
  delete: { backgroundColor: ButtonColors.delete },
  edit: { backgroundColor: ButtonColors.edit },
  continue: { backgroundColor: ButtonColors.continue },
  close: { backgroundColor: ButtonColors.close },
  disabled: { backgroundColor: ButtonColors.disabled },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabledOpacity: { opacity: 0.6 },
  text: { color: '#ffffff', fontSize: theme.fontSize.md, fontWeight: '900', letterSpacing: 0.4 },
  outlineText: { color: theme.colors.accent },
  disabledText: { color: '#ffffff' },
  });
}


