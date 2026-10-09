import { PropsWithChildren, type RefObject, useCallback, useEffect, useRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/shared/theme';

type Props = PropsWithChildren<{
  keyboard?: boolean;
  centered?: boolean;
  contentStyle?: ViewStyle;
  scrollable?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
}>;

// En iOS el evento llega antes de animar el teclado; en Android solo hay 'keyboardDidShow'.
const KEYBOARD_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
// Separación entre el campo enfocado y el borde superior del teclado.
const FOCUS_MARGIN = 16;

export function Screen({ children, keyboard = false, centered = false, contentStyle, scrollable = true, scrollRef: externalScrollRef }: Props) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const localScrollRef = useRef<ScrollView | null>(null);
  const scrollRef = externalScrollRef ?? localScrollRef;
  // Offset actual del scroll, necesario para calcular el destino del auto-scroll.
  const scrollOffsetRef = useRef(0);

  /**
   * Sube el scroll lo justo para que el campo enfocado quede visible
   * sobre el teclado. Usa coordenadas absolutas de ventana, así que
   * funciona igual en cualquier dispositivo.
   */
  const scrollFocusedInputIntoView = useCallback((keyboardTopY: number) => {
    const scroll = scrollRef.current;
    const focusedInput = TextInput.State.currentlyFocusedInput();
    if (!scroll || !focusedInput) return;

    focusedInput.measureInWindow((_x, y, _w, h) => {
      const distance = y + h + FOCUS_MARGIN - keyboardTopY;
      if (distance <= 0) return;
      scroll.scrollTo({ y: Math.max(scrollOffsetRef.current + distance, 0), animated: true });
    });
  }, [scrollRef]);

  useEffect(() => {
    if (!keyboard) return;

    const subscription = Keyboard.addListener(KEYBOARD_EVENT, ({ endCoordinates }) => {
      if (typeof endCoordinates.screenY === 'number') scrollFocusedInputIntoView(endCoordinates.screenY);
    });

    return () => subscription.remove();
  }, [keyboard, scrollFocusedInputIntoView]);

  const content = scrollable ? (
    <SafeAreaView style={styles.safeWrapper} edges={['top', 'bottom']}>
      <ScrollView
        ref={scrollRef}
        style={styles.wrapper}
        contentContainerStyle={[styles.scroll, styles.safePadding, centered && styles.centered, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => { scrollOffsetRef.current = event.nativeEvent.contentOffset.y; }}
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
