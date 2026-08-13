import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [settings, setSettings] = useState({
    pushNotifications: true,
    securityAlerts: true,
    accountActivity: true,
    reminders: true,
    emailNotifications: false,
    dailySummary: true,
    criticalAlerts: true,
  });

  function toggleSetting(key: keyof typeof settings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="arrow-back-outline" size={30} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('notifications.pushTitle')}</Text>
        <Text style={styles.sectionDescription}>{t('notifications.pushDescription')}</Text>

        <View style={styles.optionCard}>
          <NotificationRow title={t('notifications.securityAlerts')} subtitle={t('notifications.securityAlertsDescription')} value={settings.securityAlerts} onToggle={() => toggleSetting('securityAlerts')} />
          <NotificationRow title={t('notifications.accountActivity')} subtitle={t('notifications.accountActivityDescription')} value={settings.accountActivity} onToggle={() => toggleSetting('accountActivity')} />
          <NotificationRow title={t('notifications.reminders')} subtitle={t('notifications.remindersDescription')} value={settings.reminders} onToggle={() => toggleSetting('reminders')} />
        </View>

        <Text style={styles.sectionTitle}>{t('notifications.emailTitle')}</Text>
        <Text style={styles.sectionDescription}>{t('notifications.emailDescription')}</Text>

        <View style={styles.optionCard}>
          <NotificationRow title={t('notifications.dailySummary')} subtitle={t('notifications.dailySummaryDescription')} value={settings.dailySummary} onToggle={() => toggleSetting('dailySummary')} />
          <NotificationRow title={t('notifications.criticalAlerts')} subtitle={t('notifications.criticalAlertsDescription')} value={settings.criticalAlerts} onToggle={() => toggleSetting('criticalAlerts')} />
        </View>
      </View>
    </Screen>
  );
}

function NotificationRow({ title, subtitle, value, onToggle }: { title: string; subtitle: string; value: boolean; onToggle: () => void }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.optionRow}>
      <View>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        thumbColor={value ? theme.colors.accent : theme.colors.text}
        trackColor={{ false: '#5a8095', true: theme.colors.accentLight }}
      />
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: 0, marginTop: '15%' },
  topBar: { height: 67, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 24 },
  headerTitle: { color: theme.colors.accent, fontSize: 25, fontWeight: '900', textDecorationLine: 'underline' },
  content: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingTop: 24, paddingHorizontal: 24, paddingBottom: 92, gap: 18 },
  sectionTitle: { color: theme.colors.accent, fontSize: 20, fontWeight: '900' },
  sectionDescription: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 12 },
  optionCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 20, gap: 16, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, elevation: 5 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionTitle: { color: theme.colors.accent, fontSize: theme.fontSize.md, fontWeight: '900', marginBottom: 4 },
  optionSubtitle: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, lineHeight: 20, maxWidth: '80%' },
  });
}
