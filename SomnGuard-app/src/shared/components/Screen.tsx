import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/shared/theme';

type Props = PropsWithChildren<{ keyboard?: boolean; centered?: boolean; contentStyle?: ViewStyle; scrollable?: boolean }>;

export function Screen({ children, keyboard = false, centered = false, contentStyle, scrollable = true }: Props) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const content = scrollable ? (
    <SafeAreaView style={styles.safeWrapper} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.wrapper}
        contentContainerStyle={[styles.scroll, styles.safePadding, centered && styles.centered, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  ) : (
    <SafeAreaView style={[styles.safeWrapper, styles.safePadding, centered && styles.centered, contentStyle]} edges={['top', 'bottom']}>
      {children}
    </SafeAreaView>
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
  safeWrapper: { flex: 1, backgroundColor: theme.colors.background },
  staticWrapper: { flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.xl },
  scroll: { flexGrow: 1, backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.xl },
  safePadding: { paddingTop: 12, paddingBottom: 12 },
  centered: { justifyContent: 'center' },
  });
}


