import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppAlertModal } from '@/shared/components/AppAlertModal';
import { AppButton } from '@/shared/components/AppButton';
import { Screen } from '@/shared/components/Screen';
import { STATIC_COPY } from '@/shared/i18n/constants';
import { useAppTheme } from '@/shared/theme';

export default function SupportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  function showModal(title: string, message: string) {
    setModal({ visible: true, title, message });
  }

  function handleFaq() {
    showModal(t('support.faq'), t('support.faqAlertMessage'));
  }

  function handleContact() {
    showModal(t('support.contact'), t('support.contactAlertMessage'));
  }

  function handleReport() {
    showModal(t('support.report'), t('support.reportAlertMessage'));
  }

  return (
    <Screen scrollable={false} contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="arrow-back-outline" size={28} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('support.title')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('support.needHelp')}</Text>
          <Text style={styles.cardDescription}>{t('support.description')}</Text>
          <AppButton title={t('support.contact')} onPress={handleContact} />
        </View>

        <View style={styles.cardAction}>
          <Text style={styles.actionTitle}>{t('support.faq')}</Text>
          <Text style={styles.actionSubtitle}>{t('support.faqDescription')}</Text>
          <AppButton title={t('support.viewFaq').replace(STATIC_COPY.faqLabel, STATIC_COPY.faqLabel)} variant="outline" onPress={handleFaq} />
        </View>

        <View style={styles.cardAction}>
          <Text style={styles.actionTitle}>{t('support.report')}</Text>
          <Text style={styles.actionSubtitle}>{t('support.reportDescription')}</Text>
          <AppButton title={t('support.reportButton')} variant="outline" onPress={handleReport} />
        </View>
      </View>
      <AppAlertModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onRequestClose={() => setModal({ visible: false, title: '', message: '' })}
        buttons={[{ text: t('common.confirm'), onPress: () => setModal({ visible: false, title: '', message: '' }) }]}
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
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 20, gap: 12, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, elevation: 5 },
  cardTitle: { color: theme.colors.accent, fontSize: theme.fontSize.md, fontWeight: '900' },
  cardDescription: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, lineHeight: 20 },
  cardAction: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 20, gap: 10, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  actionTitle: { color: theme.colors.accent, fontSize: theme.fontSize.md, fontWeight: '900' },
  actionSubtitle: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, lineHeight: 20 },
  });
}