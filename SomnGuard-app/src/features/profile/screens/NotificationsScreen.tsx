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
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <Screen scrollable={false} contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="arrow-back-outline" size={28} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('notifications.pushTitle')}</Text>
        <Text style={styles.sectionDescription}>{t('notifications.pushDescription')}</Text>

        <View style={styles.optionCard}>
          <View style={styles.optionRow}>
            <View style={styles.optionTextBlock}>
              <Text style={styles.optionTitle}>{t('notifications.pushTitle')}</Text>
              <Text style={styles.optionSubtitle}>{t('notifications.pushDescription')}</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              thumbColor={pushEnabled ? theme.colors.accent : theme.colors.text}
              trackColor={{ false: '#5a8095', true: theme.colors.accentLight }}
            />
          </View>
          <Text style={styles.statusText}>{pushEnabled ? t('common.enabled') : t('common.disabled')}</Text>
        </View>
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: 0, flex: 1 },
  topBar: { height: 56, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  headerTitle: { color: theme.colors.accent, fontSize: 20, fontWeight: '900', textDecorationLine: 'underline' },
  content: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center', paddingTop: 16, paddingHorizontal: 24, paddingBottom: 16, gap: 14 },
  sectionTitle: { color: theme.colors.accent, fontSize: 20, fontWeight: '900' },
  sectionDescription: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 12 },
  optionCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 20, gap: 16, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, elevation: 5 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionTextBlock: { flex: 1, paddingRight: 12 },
  optionTitle: { color: theme.colors.accent, fontSize: theme.fontSize.md, fontWeight: '900', marginBottom: 4 },
  optionSubtitle: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, lineHeight: 20, maxWidth: '100%' },
  statusText: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, fontWeight: '700' },
  });
}