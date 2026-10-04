import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/shared/theme';

import { ButtonColors } from '@/shared/theme/theme';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'confirm' | 'delete' | 'edit' | 'continue' | 'close' | 'disabled';
};

type Props = {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onRequestClose: () => void;
};

export function AppAlertModal({ visible, title, message, buttons, onRequestClose }: Props) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const resolvedButtons: AlertButton[] =
    buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default', onPress: onRequestClose }];

  function getButtonStyle(style?: string) {
    if (style === 'destructive' || style === 'delete') return styles.deleteButton;
    if (style === 'cancel') return styles.cancelButton;
    if (style === 'confirm') return styles.confirmButton;
    if (style === 'edit') return styles.editButton;
    if (style === 'continue') return styles.continueButton;
    if (style === 'close') return styles.closeButton;
    if (style === 'disabled') return styles.disabledButton;
    return styles.defaultButton;
  }

  function getButtonTextStyle(style?: string) {
    if (style === 'destructive' || style === 'delete') return styles.deleteButtonText;
    if (style === 'cancel') return styles.cancelButtonText;
    if (style === 'confirm') return styles.confirmButtonText;
    if (style === 'edit') return styles.editButtonText;
    if (style === 'continue') return styles.continueButtonText;
    if (style === 'close') return styles.closeButtonText;
    if (style === 'disabled') return styles.disabledButtonText;
    return styles.defaultButtonText;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.buttons}>
            {resolvedButtons.map((btn, idx) => (
              <Pressable
                key={`${btn.text}-${idx}`}
                style={({ pressed }) => [styles.button, getButtonStyle(btn.style), pressed && styles.pressed]}
                onPress={() => {
                  if (btn.onPress) btn.onPress();
                  // if button is not custom destructive with manual close, close modal
                  // Caller is responsible to close via onPress if needed
                }}
              >
                <Text style={getButtonTextStyle(btn.style)}>{btn.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    content: {
      backgroundColor: theme.colors.header,
      borderRadius: 17,
      padding: 24,
      width: '88%',
      maxWidth: 360,
      alignItems: 'center',
      boxShadow: '0px 5px 10px rgba(0,0,0,0.5)',
    },
    title: { color: theme.colors.accent, fontSize: 20, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
    message: { color: theme.colors.accent, fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 22, opacity: 0.9 },
    buttons: { flexDirection: 'row', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
    button: { paddingVertical: 11, paddingHorizontal: 18, borderRadius: 12, minWidth: 110, alignItems: 'center', justifyContent: 'center' },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    defaultButton: { backgroundColor: ButtonColors.confirm },
    defaultButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
    confirmButton: { backgroundColor: ButtonColors.confirm },
    confirmButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
    cancelButton: { backgroundColor: ButtonColors.cancel },
    cancelButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
    deleteButton: { backgroundColor: ButtonColors.delete },
    deleteButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
    destructiveButton: { backgroundColor: ButtonColors.delete },
    destructiveButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
    editButton: { backgroundColor: ButtonColors.edit },
    editButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
    continueButton: { backgroundColor: ButtonColors.continue },
    continueButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
    closeButton: { backgroundColor: ButtonColors.close },
    closeButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
    disabledButton: { backgroundColor: ButtonColors.disabled },
    disabledButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700', opacity: 0.9 },
  });
}