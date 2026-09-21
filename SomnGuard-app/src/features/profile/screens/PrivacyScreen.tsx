import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppAlertModal } from '@/shared/components/AppAlertModal';
import { AppButton } from '@/shared/components/AppButton';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';

export default function PrivacyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  function showModal(title: string, message: string) {
    setModal({ visible: true, title, message });
  }

  function hideModal() {
    setModal({ visible: false, title: '', message: '' });
  }

  function handleDownload() {
    showModal(t('privacy.downloadAlertTitle'), t('privacy.downloadAlertMessage'));
  }

  function handlePolicy() {
    showModal(t('privacy.policyTitle'), t('privacy.policyMessage'));
  }

  function handleConsent() {
    showModal(t('privacy.consentTitle'), t('privacy.consentMessage'));
  }

  return (
    <Screen scrollable={false} contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="arrow-back-outline" size={28} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('privacy.title')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('privacy.section')}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('privacy.dataTreatmentTitle')}</Text>
          <Text style={styles.cardDescription}>{t('privacy.dataTreatmentDescription')}</Text>
          <AppButton title={t('privacy.policyButton')} variant="outline" onPress={handlePolicy} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('privacy.consentTitle')}</Text>
          <Text style={styles.cardDescription}>{t('privacy.consentDescription')}</Text>
          <AppButton title={t('privacy.consentButton')} variant="outline" onPress={handleConsent} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('privacy.downloadTitle')}</Text>
          <Text style={styles.cardDescription}>{t('privacy.downloadDescription')}</Text>
          <AppButton title={t('privacy.downloadButton')} onPress={handleDownload} />
        </View>
      </View>
      <AppAlertModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onRequestClose={hideModal}
        buttons={[{ text: t('common.confirm'), onPress: hideModal }]}
      />
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: 0, flex: 1 },
  topBar: { height: 56, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  headerTitle: { color: theme.colors.accent, fontSize: 20, fontWeight: '900', textDecorationLine: 'underline' },
  content: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center', paddingTop: 16, paddingHorizontal: 24, paddingBottom: 16, gap: 14, justifyContent: 'flex-start' },
  sectionTitle: { color: theme.colors.accent, fontSize: 20, fontWeight: '900', marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 20, gap: 12, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, elevation: 5 },
  cardDanger: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 20, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 85, 85, 0.4)' },
  cardTitle: { color: theme.colors.accent, fontSize: theme.fontSize.md, fontWeight: '900' },
  cardTitleDanger: { color: '#ff5555', fontSize: theme.fontSize.md, fontWeight: '900' },
  cardDescription: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, lineHeight: 20 },
  });
}