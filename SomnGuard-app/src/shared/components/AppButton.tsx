import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '@/shared/theme';

type Props = { title: string; onPress: () => void; variant?: 'primary' | 'outline' | 'danger' };

export function AppButton({ title, onPress, variant = 'primary' }: Props) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed]} onPress={onPress}>
      <Text style={[styles.text, variant !== 'primary' && styles.outlineText]}>{title}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  base: { minHeight: 43, borderRadius: theme.radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, width: '100%' },
  primary: { backgroundColor: theme.colors.accent },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.accent },
  danger: { backgroundColor: 'rgba(204,51,51,0.15)', borderWidth: 1, borderColor: 'rgba(204,51,51,0.45)' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  text: { color: theme.colors.background, fontSize: theme.fontSize.md, fontWeight: '900', letterSpacing: 0.4 },
  outlineText: { color: theme.colors.accent },
  });
}


