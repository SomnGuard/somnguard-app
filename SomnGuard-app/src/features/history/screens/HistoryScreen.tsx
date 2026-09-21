import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/components/Screen';
import { historyEvents } from '@/features/history/mocks/history.mock';
import { useAppTheme } from '@/shared/theme';

const filterTypes = [
  { id: 'all', labelKey: 'history.filters.types.all' },
  { id: 'distraction', labelKey: 'history.filters.types.distraction' },
  { id: 'sleepiness', labelKey: 'history.filters.types.sleepiness' },
  { id: 'eyeClosure', labelKey: 'history.filters.types.eyeClosure' },
] as const;

function parseDateInput(value: string): Date | null {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(/\//g, '-');
  const parts = normalized.split('-');
  let date: Date | null = null;
  if (parts.length === 3) {
    if (parts[0].length === 4) date = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
    else date = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
  } else {
    date = new Date(normalized);
  }
  return isNaN(date.getTime()) ? null : date;
}

function isInRange(eventDate: string, from: string, to: string): boolean {
  const event = new Date(eventDate);
  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to);
  if (fromDate && event < fromDate) return false;
  if (toDate) {
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    if (event > end) return false;
  }
  return true;
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  function resetFilters() {
    setSelectedType('all');
    setFromDate('');
    setToDate('');
  }

  const filteredEvents = historyEvents.filter((event) => {
    const typeMatch = selectedType === 'all' || event.type === selectedType;
    const dateMatch = isInRange(event.date, fromDate, toDate);
    return typeMatch && dateMatch;
  });

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>{t('history.title')}</Text>
          <Text style={styles.subtitle}>{t('history.subtitle')}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={resetFilters}>
          <Text style={styles.reset}>{t('history.filters.reset')}</Text>
        </Pressable>
      </View>

      <View style={styles.filterCard}>
        <Text style={styles.sectionTitle}>{t('history.filters.dateRange')}</Text>
        <View style={styles.dateRow}>
          <FilterInput label={t('history.filters.fromDate')} value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" />
          <FilterInput label={t('history.filters.toDate')} value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" />
        </View>

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
      </View>

      <View style={styles.eventsList}>
        {filteredEvents.length === 0 && <Text style={styles.emptyText}>{t('history.filters.noResults')}</Text>}
        {filteredEvents.map((event) => (
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
    screen: { padding: theme.spacing.lg, paddingTop: 0, gap: 16 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    headerTextBlock: { flex: 1 },
    title: { color: theme.colors.accent, fontSize: theme.fontSize.xl, fontWeight: '900', marginBottom: 4 },
    subtitle: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
    reset: { color: '#128bff', fontSize: 14, textDecorationLine: 'underline', fontWeight: '700' },
    filterCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, gap: 12 },
    sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
    dateRow: { flexDirection: 'row', gap: 12 },
    dateField: { flex: 1 },
    inputLabel: { color: theme.colors.text, fontSize: 11, fontWeight: '900', marginBottom: 6 },
    dateInput: { height: 41, borderRadius: 7, backgroundColor: theme.colors.header, color: theme.colors.accent, paddingHorizontal: 10, fontWeight: '800' },
    chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    chip: { minWidth: 66, maxWidth: 96, height: 35, borderRadius: 8, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 5, elevation: 3 },
    chipSelected: { backgroundColor: theme.colors.tabIconSelected },
    chipText: { color: theme.colors.header, fontSize: 13, fontWeight: '900' },
    chipTextSelected: { color: '#ffffff' },
    eventsList: { gap: 11, paddingBottom: 12 },
    emptyText: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 },
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