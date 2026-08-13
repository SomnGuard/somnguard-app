import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/shared/theme';

type Props = PropsWithChildren<{ keyboard?: boolean; centered?: boolean; contentStyle?: ViewStyle }>;

export function Screen({ children, keyboard = false, centered = false, contentStyle }: Props) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const content = (
    <ScrollView
      style={styles.wrapper}
      contentContainerStyle={[styles.scroll, centered && styles.centered, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );

  if (!keyboard) return content;

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {content}
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xxl },
  centered: { justifyContent: 'center' },
  });
}


