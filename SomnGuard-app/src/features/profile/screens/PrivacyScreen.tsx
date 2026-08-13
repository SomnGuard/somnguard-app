import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/shared/components/AppButton';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';

export default function PrivacyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  function handleDownload() {
    Alert.alert(t('privacy.downloadAlertTitle'), t('privacy.downloadAlertMessage'));
  }

  function handlePermissions() {
    Alert.alert(t('privacy.permissionsAlertTitle'), t('privacy.permissionsAlertMessage'));
  }

  function handleDelete() {
    Alert.alert(t('privacy.deleteTitle'), t('privacy.deleteAlertMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => router.replace('/(auth)/login') },
    ]);
  }

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="arrow-back-outline" size={30} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('privacy.title')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('privacy.section')}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('privacy.downloadTitle')}</Text>
          <Text style={styles.cardDescription}>{t('privacy.downloadDescription')}</Text>
          <AppButton title={t('privacy.downloadButton')} onPress={handleDownload} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('privacy.permissionsTitle')}</Text>
          <Text style={styles.cardDescription}>{t('privacy.permissionsDescription')}</Text>
          <AppButton title={t('privacy.permissionsButton')} variant="outline" onPress={handlePermissions} />
        </View>

        <View style={styles.cardDanger}>
          <Text style={styles.cardTitleDanger}>{t('privacy.deleteTitle')}</Text>
          <Text style={styles.cardDescription}>{t('privacy.deleteDescription')}</Text>
          <AppButton title={t('privacy.deleteTitle')} variant="danger" onPress={handleDelete} />
        </View>
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: 0 },
  topBar: { height: 67, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 24 },
  headerTitle: { color: theme.colors.accent, fontSize: 25, fontWeight: '900', textDecorationLine: 'underline' },
  content: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingTop: 24, paddingHorizontal: 24, paddingBottom: 92, gap: 18 },
  sectionTitle: { color: theme.colors.accent, fontSize: 20, fontWeight: '900', marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 20, gap: 12, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, elevation: 5 },
  cardDanger: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 20, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 85, 85, 0.4)' },
  cardTitle: { color: theme.colors.accent, fontSize: theme.fontSize.md, fontWeight: '900' },
  cardTitleDanger: { color: '#ff5555', fontSize: theme.fontSize.md, fontWeight: '900' },
  cardDescription: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, lineHeight: 20 },
  });
}
