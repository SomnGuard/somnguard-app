import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/components/Screen';
import { AppButton } from '@/shared/components/AppButton';
import { useAppTheme } from '@/shared/theme';
import { getSeverityBg } from '@/shared/theme/theme';
import { profileService } from '@/features/profile/services/profile.service';
import { eventsApi, type EventDetailDto } from '@/shared/api/eventsApi';
import {
  categoryIcon,
  eventCategoryOf,
  eventDateKey,
  formatEventTime,
  severityColor,
  toAlertSeverity,
} from '@/shared/utils/eventDisplay';

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

function isInRange(eventDateKey: string, from: string, to: string): boolean {
  if (!eventDateKey) return true;
  const event = new Date(`${eventDateKey}T00:00:00`);
  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to);
  if (fromDate && event < new Date(fromDate.setHours(0, 0, 0, 0))) return false;
  if (toDate) {
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    if (event > end) return false;
  }
  return true;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [events, setEvents] = useState<EventDetailDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [hasDevice, setHasDevice] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  async function load() {
    try {
      setIsLoading(true);
      setLoadError(undefined);
      const list = await profileService.fetchDevices();
      const first = list[0] ?? null;
      setHasDevice(!!first);
      if (!first) {
        setEvents([]);
        return;
      }
      setEvents(await eventsApi.listEvents({ deviceId: first.id, pageSize: 50 }));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t('history.filters.noResults'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetFilters() {
    setSelectedType('all');
    setFromDate('');
    setToDate('');
  }

  const filteredEvents = events.filter((event) => {
    const category = eventCategoryOf(event.eventType?.code, event.eventType?.name);
    const typeMatch = selectedType === 'all' || category === selectedType;
    const dateMatch = isInRange(eventDateKey(event.occurredAt), fromDate, toDate);
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
        {isLoading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator color={theme.colors.accent} size="small" />
            <Text style={styles.emptyText}>{t('common.validating')}</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centerWrap}>
            <Text style={styles.errorText}>{loadError}</Text>
            <View style={styles.retryWrap}>
              <AppButton title={t('common.retry')} variant="outline" onPress={load} />
            </View>
          </View>
        ) : !hasDevice ? (
          <View style={styles.centerWrap}>
            <Text style={styles.emptyText}>{t('device.notLinked')}</Text>
            <View style={styles.retryWrap}>
              <AppButton title={t('device.goToAccount')} variant="confirm" onPress={() => router.push('/profile/cuenta' as any)} />
            </View>
          </View>
        ) : (
          <>
            {filteredEvents.length === 0 && <Text style={styles.emptyText}>{t('history.filters.noResults')}</Text>}
            {filteredEvents.map((event) => {
              const severity = toAlertSeverity(event.severity?.code);
              const color = severityColor(event.severity?.code);
              const category = eventCategoryOf(event.eventType?.code, event.eventType?.name);
              return (
                <View key={event.id} style={[styles.eventCard, { borderColor: color, backgroundColor: getSeverityBg(severity, 0.12) }]}>
                  <View style={[styles.severityDot, { backgroundColor: color }]} />
                  <View style={styles.eventIconWrap}>
                    <Ionicons name={categoryIcon(category)} size={20} color={color} />
                  </View>
                  <View style={styles.eventBody}>
                    <Text style={[styles.eventTitle, { color }]} numberOfLines={1}>
                      {event.eventType?.name || event.eventType?.code || '—'}
                    </Text>
                    <Text style={styles.eventSummary} numberOfLines={1}>
                      {event.severity?.name || event.severity?.code || ''}
                    </Text>
                    <Text style={styles.eventDetail} numberOfLines={2}>
                      {event.occurredAt ? new Date(event.occurredAt).toLocaleString() : ''}
                      {event.hasEvidence ? ' · ✓' : ''}
                    </Text>
                  </View>
                  <Text style={styles.eventTime}>{formatEventTime(event.occurredAt)}</Text>
                </View>
              );
            })}
          </>
        )}
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
    centerWrap: { alignItems: 'center', gap: 12, paddingVertical: 20 },
    retryWrap: { width: '100%', maxWidth: 280 },
    emptyText: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 },
    errorText: { color: theme.colors.error, fontSize: 14, fontWeight: '700', textAlign: 'center' },
    eventCard: { minHeight: 70, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
    severityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    eventIconWrap: { width: 28, alignItems: 'center', marginRight: 8 },
    eventBody: { flex: 1 },
    eventTitle: { fontSize: 14, fontWeight: '900', marginBottom: 2 },
    eventSummary: { color: theme.colors.text, fontSize: 12, fontWeight: '700', marginBottom: 2 },
    eventDetail: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '500' },
    eventTime: { color: theme.colors.text, fontSize: 12, fontWeight: '800', marginLeft: 10 },
  });
}
