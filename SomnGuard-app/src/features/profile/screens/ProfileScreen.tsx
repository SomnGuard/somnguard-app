import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type React from 'react';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/components/Screen';
import { profile } from '@/features/profile/mocks/profile.mock';
import { useAppTheme } from '@/shared/theme';
import { authService } from '@/features/auth/services/auth.service';

type MenuItem = {
  labelKey: string;
  route: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const menuItems: MenuItem[] = [
  { labelKey: 'profile.menu.account', route: 'cuenta', icon: 'person' },
  { labelKey: 'profile.menu.security', route: 'seguridad', icon: 'shield-outline' },
  { labelKey: 'profile.menu.preferences', route: 'preferencias', icon: 'options-outline' },
  { labelKey: 'profile.menu.notifications', route: 'notificaciones', icon: 'notifications' },
  { labelKey: 'profile.menu.privacy', route: 'privacidad-de-datos', icon: 'id-card-outline' },
  { labelKey: 'profile.menu.support', route: 'soporte', icon: 'help-buoy-outline' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  function handleMenuPress(route: string) {
    router.push(`/profile/${route}` as any);
  }

  async function confirmLogout() {
    setShowLogoutModal(false);
    await authService.logout();
    router.replace('/(auth)/login');
  }

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/(tabs)')}>
          <Ionicons name="arrow-back-outline" size={36} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#5c5b54" />
            <View style={styles.avatarBase} />
          </View>
          <View style={styles.profileTextBlock}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
          </View>
        </View>

        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <Pressable key={item.labelKey} accessibilityRole="button" style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]} onPress={() => handleMenuPress(item.route)}>
              <Ionicons name={item.icon} size={36} color={theme.colors.accent} style={styles.menuIcon} />
              <Text style={styles.menuLabel} numberOfLines={1}>{t(item.labelKey)}</Text>
              <Ionicons name="arrow-forward-outline" size={22} color={theme.colors.accent} />
            </Pressable>
          ))}
        </View>

        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} onPress={() => setShowLogoutModal(true)}>
          <Ionicons name="log-out-outline" size={34} color={theme.colors.accent} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </Pressable>
      </View>

      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.logout')}</Text>
            <Text style={styles.modalMessage}>{t('profile.logoutQuestion')}</Text>
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.confirmButton]} onPress={confirmLogout}>
                <Text style={styles.confirmButtonText}>{t('profile.logout')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: '15%' },
  topBar: { height: 67, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 28 },
  headerTitle: { color: theme.colors.accent, fontSize: 25, fontWeight: '900', textDecorationLine: 'underline' },
  content: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingTop: 24, paddingHorizontal: 31, paddingBottom: 92 },
  profileCard: { minHeight: 105, borderRadius: 17, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, shadowColor: '#000', shadowOpacity: 0.32, shadowRadius: 8, elevation: 5, marginBottom: 27 },
  avatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#101727', alignItems: 'center', justifyContent: 'center', marginRight: 13, overflow: 'hidden' },
  avatarBase: { position: 'absolute', bottom: 17, width: 48, height: 11, borderRadius: 16, backgroundColor: '#5c5b54' },
  profileTextBlock: { flex: 1 },
  profileName: { color: theme.colors.accent, fontSize: 25, fontWeight: '900', marginBottom: 6 },
  profileEmail: { color: theme.colors.accent, fontSize: 13, fontWeight: '500' },
  menuList: { gap: 13 },
  menuItem: { minHeight: 52, borderRadius: 16, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  menuIcon: { width: 40, marginRight: 15 },
  menuLabel: { flex: 1, color: theme.colors.accent, fontSize: 20, fontWeight: '900' },
  logoutButton: { minHeight: 53, borderRadius: 15, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 56, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 7, elevation: 4 },
  logoutText: { color: theme.colors.accent, fontSize: 18, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: theme.colors.header, borderRadius: 17, padding: 24, width: '80%', maxWidth: 320, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  modalTitle: { color: theme.colors.accent, fontSize: 24, fontWeight: '900', marginBottom: 12 },
  modalMessage: { color: theme.colors.accent, fontSize: 16, textAlign: 'center', marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 16 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, minWidth: 100, alignItems: 'center' },
  cancelButton: { backgroundColor: '#5c5b54' },
  cancelButtonText: { color: theme.colors.accent, fontSize: 16, fontWeight: '600' },
  confirmButton: { backgroundColor: '#d32f2f' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
}
