import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';
import { historyEvents } from '@/features/history/mocks/history.mock';

const filterTypes = [
  { id: 'all', labelKey: 'history.filters.types.all' },
  { id: 'distraction', labelKey: 'history.filters.types.distraction' },
  { id: 'sleepiness', labelKey: 'history.filters.types.sleepiness' },
  { id: 'eyeClosure', labelKey: 'history.filters.types.eyeClosure' },
] as const;

export default function HistoryFiltersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [lastEvents, setLastEvents] = useState('');
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  function resetFilters() {
    setSelectedType('all');
    setFromDate('');
    setToDate('');
    setLastEvents('');
  }

  return (
    <Screen keyboard contentStyle={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close-outline" size={46} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('history.filters.title')}</Text>
        <Pressable accessibilityRole="button" onPress={resetFilters}>
          <Text style={styles.reset}>{t('history.filters.reset')}</Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>{t('history.filters.dateRange')}</Text>
      <View style={styles.dateRow}>
        <FilterInput label={t('history.filters.fromDate')} value={fromDate} onChangeText={setFromDate} placeholder="" />
        <FilterInput label={t('history.filters.toDate')} value={toDate} onChangeText={setToDate} placeholder="" />
      </View>

      <Text style={styles.sectionTitle}>{t('history.filters.latestEvents')}</Text>
      <TextInput value={lastEvents} onChangeText={setLastEvents} keyboardType="number-pad" style={styles.fullInput} placeholder="" placeholderTextColor={theme.colors.placeholder} />

      <Text style={styles.sectionTitle}>{t('history.filters.eventType')}</Text>
      <View style={styles.chipRow}>
        {filterTypes.map((item) => {
          const selected = selectedType === item.id;
          return (
            <Pressable key={item.id} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setSelectedType(item.id)}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>{t(item.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.eventsList}>
        {historyEvents.map((event) => (
          <View key={event.id} style={[styles.eventCard, event.tone === 'danger' ? styles.eventDanger : styles.eventInfo]}>
            <View style={styles.eventIconWrap}>
              <Ionicons name={event.icon} size={38} color="#ffffff" />
            </View>
            <View style={styles.eventBody}>
              <Text style={styles.eventTitle}>{t(event.titleKey)}</Text>
              <Text style={styles.eventSummary}>{t(event.summaryKey)}</Text>
              <Text style={styles.eventDetail}>{t(event.detailKey)}</Text>
            </View>
            <Text style={styles.eventTime}>{t(event.timeKey)}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function FilterInput({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.dateField}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.dateInput} placeholder={placeholder} placeholderTextColor={theme.colors.placeholder} />
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: 8 },
  header: { height: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22 },
  closeButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', marginRight: 38 },
  title: { flex: 1, color: theme.colors.text, fontSize: 39, fontWeight: '900' },
  reset: { color: '#128bff', fontSize: 14, textDecorationLine: 'underline', fontWeight: '700' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginBottom: 12 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '900', marginHorizontal: 23, marginTop: 0, marginBottom: 14 },
  dateRow: { flexDirection: 'row', gap: 24, marginHorizontal: 24, marginBottom: 24 },
  dateField: { flex: 1 },
  inputLabel: { color: theme.colors.text, fontSize: 12, fontWeight: '900', marginBottom: 8 },
  dateInput: { height: 41, borderRadius: 7, backgroundColor: theme.colors.header, color: theme.colors.accent, paddingHorizontal: 10, fontWeight: '800' },
  fullInput: { height: 41, borderRadius: 7, backgroundColor: theme.colors.header, color: theme.colors.accent, marginHorizontal: 24, marginBottom: 24, paddingHorizontal: 10, fontWeight: '800' },
  chipRow: { flexDirection: 'row', gap: 6, marginHorizontal: 23, marginBottom: 28 },
  chip: { minWidth: 66, maxWidth: 96, height: 35, borderRadius: 8, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 5, elevation: 3 },
  chipSelected: { backgroundColor: theme.colors.tabIconSelected},
  chipText: { color: theme.colors.header, fontSize: 14, fontWeight: '900' },
  chipTextSelected: { color: '#ffffff' },
  eventsList: { gap: 11, paddingHorizontal: 24 },
  eventCard: { minHeight: 70, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 9, elevation: 5 },
  eventDanger: { backgroundColor: '#d30610', shadowColor: '#ff1b1b' },
  eventInfo: { backgroundColor: theme.colors.header },
  eventIconWrap: { width: 38, alignItems: 'center', marginRight: 10 },
  eventBody: { flex: 1 },
  eventTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900', marginBottom: 4 },
  eventSummary: { color: '#ffffff', fontSize: 10, fontWeight: '900', marginBottom: 3 },
  eventDetail: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  eventTime: { color: '#ffffff', fontSize: 12, fontWeight: '900', marginLeft: 10 },
  });
}
