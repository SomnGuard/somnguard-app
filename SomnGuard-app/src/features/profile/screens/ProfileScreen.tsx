import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/components/Screen';
import { profileService } from '@/features/profile/services/profile.service';
import { useAppTheme } from '@/shared/theme';
import { authService } from '@/features/auth/services/auth.service';

type MenuItem = {
  labelKey: string;
  route: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const menuItems: MenuItem[] = [
  { labelKey: 'profile.menu.account', route: 'cuenta', icon: 'person' },
  { labelKey: 'profile.menu.device', route: 'dispositivo', icon: 'hardware-chip-outline' },
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
  const [displayName, setDisplayName] = useState('');
  const [displayEmail, setDisplayEmail] = useState('');
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  useEffect(() => {
    let mounted = true;
    profileService
      .fetchProfile()
      .then((user) => {
        if (!mounted) return;
        setDisplayName(`${user.firstName} ${user.lastName}`.trim());
        setDisplayEmail(user.email);
      })
      .catch(() => {
        const info = profileService.getProfile();
        if (!mounted) return;
        setDisplayName(`${info.firstName} ${info.lastName}`.trim());
        setDisplayEmail(profileService.getEmail());
      });
    return () => {
      mounted = false;
    };
  }, []);

  function handleMenuPress(route: string) {
    router.push(`/profile/${route}` as any);
  }

  async function confirmLogout() {
    setShowLogoutModal(false);
    await authService.logout();
    router.replace('/(auth)/login');
  }

  return (
    <Screen scrollable={false} contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/(tabs)')}>
          <Ionicons name="arrow-back-outline" size={28} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={34} color="#5c5b54" />
            <View style={styles.avatarBase} />
          </View>
          <View style={styles.profileTextBlock}>
            <Text style={styles.profileName} numberOfLines={1} adjustsFontSizeToFit>{displayName}</Text>
            <Text style={styles.profileEmail} numberOfLines={1} adjustsFontSizeToFit>{displayEmail}</Text>
          </View>
        </View>

        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <Pressable key={item.labelKey} accessibilityRole="button" style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]} onPress={() => handleMenuPress(item.route)}>
              <Ionicons name={item.icon} size={28} color={theme.colors.accent} style={styles.menuIcon} />
              <Text style={styles.menuLabel} numberOfLines={1} adjustsFontSizeToFit>{t(item.labelKey)}</Text>
              <Ionicons name="arrow-forward-outline" size={20} color={theme.colors.accent} />
            </Pressable>
          ))}
        </View>

        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} onPress={() => setShowLogoutModal(true)}>
          <Ionicons name="log-out-outline" size={26} color={theme.colors.accent} />
          <Text style={styles.logoutText} numberOfLines={1} adjustsFontSizeToFit>{t('profile.logout')}</Text>
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
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0, paddingTop: 0 },
  topBar: { height: 52, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle: { color: theme.colors.accent, fontSize: 18, fontWeight: '900', textDecorationLine: 'underline', flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center', paddingTop: 10, paddingHorizontal: 16, gap: 10, justifyContent: 'flex-start', paddingBottom: 8 },
  profileCard: { minHeight: 76, borderRadius: 16, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.32, shadowRadius: 8, elevation: 5, marginBottom: 4 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#101727', alignItems: 'center', justifyContent: 'center', marginRight: 10, overflow: 'hidden' },
  avatarBase: { position: 'absolute', bottom: 10, width: 34, height: 8, borderRadius: 16, backgroundColor: '#5c5b54' },
  profileTextBlock: { flex: 1, minWidth: 0 },
  profileName: { color: theme.colors.accent, fontSize: 15, fontWeight: '900', marginBottom: 2 },
  profileEmail: { color: theme.colors.accent, fontSize: 11, fontWeight: '500' },
  menuList: { gap: 10, paddingVertical: 4 },
  menuItem: { minHeight: 52, borderRadius: 16, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  menuIcon: { width: 32, marginRight: 12, textAlign: 'center' },
  menuLabel: { flex: 1, color: theme.colors.accent, fontSize: 15, fontWeight: '800', textAlign: 'left' },
  logoutButton: { minHeight: 54, borderRadius: 16, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 7, elevation: 4 },
  logoutText: { color: theme.colors.accent, fontSize: 16, fontWeight: '800', textAlign: 'center', flexShrink: 1 },
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