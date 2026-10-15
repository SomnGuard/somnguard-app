import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/components/Screen';
import { AppButton } from '@/shared/components/AppButton';
import { useAppTheme } from '@/shared/theme';
import { getSeverityBg } from '@/shared/theme/theme';
import { profileService } from '@/features/profile/services/profile.service';
import { ApiError } from '@/shared/api/client';
import { eventsApi, type EventDetailDto } from '@/shared/api/eventsApi';
import {
  categoryIcon,
  categoryOfTypeId,
  categoryTypeIds,
  eventCategoryOf,
  eventDateKey,
  formatEventTime,
  severityColor,
  toAlertSeverity,
  type CatalogTypeRef,
  type EventCategory,
} from '@/shared/utils/eventDisplay';

// Eventos por página (requerido) y cap del backend (EventQueryService: min(max(pageSize,1),100))
const PAGE_SIZE = 10;
const SERVER_PAGE_CAP = 100;

const filterTypes: { id: EventCategory | 'all' }[] = [
  { id: 'all' },
  { id: 'distraction' },
  { id: 'sleepiness' },
  { id: 'eyeClosure' },
  { id: 'other' },
];

function parseDateInput(value: string): Date | null {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(/\//g, '-');
  const parts = normalized.split('-');
  let date: Date | null = null;
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      date = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}T00:00:00`);
    } else {
      date = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`);
    }
  } else {
    date = new Date(normalized);
  }
  return date && !isNaN(date.getTime()) ? date : null;
}

function isFutureDay(value: string): boolean {
  const d = parseDateInput(value);
  if (!d) return false;
  // Solo pasado y presente: cualquier día posterior a hoy es inválido
  return eventDateKey(d.toISOString()) > eventDateKey(new Date().toISOString());
}

function toISOStart(value: string): string | undefined {
  const d = parseDateInput(value);
  if (!d) return undefined;
  if (isFutureDay(value)) return undefined;
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toISOEnd(value: string): string | undefined {
  const d = parseDateInput(value);
  if (!d) return undefined;
  if (isFutureDay(value)) return undefined;
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function dateKeyToDate(key: string): Date {
  const d = parseDateInput(key);
  return d ?? new Date();
}

function isInRange(key: string, from: string, to: string): boolean {
  if (!key) return true;
  const event = new Date(`${key}T00:00:00`);
  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to);
  if (fromDate) {
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    if (event < start) return false;
  }
  if (toDate) {
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    if (event > end) return false;
  }
  return true;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedType, setSelectedType] = useState<'all' | EventCategory>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [events, setEvents] = useState<EventDetailDto[]>([]);
  const [deviceLabel, setDeviceLabel] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [catalog, setCatalog] = useState<CatalogTypeRef[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadErrorStatus, setLoadErrorStatus] = useState<number | null>(null);
  const [hasDevice, setHasDevice] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function scrollTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  const [selectedEvent, setSelectedEvent] = useState<EventDetailDto | null>(null);
  const [evidenceUri, setEvidenceUri] = useState<string | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceStatus, setEvidenceStatus] = useState<number | null>(null);

  const listReq = useRef(0);
  const evidenceReq = useRef(0);

  function sortDesc(rows: EventDetailDto[]): EventDetailDto[] {
    return [...rows].sort((a, b) => {
      const ta = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
      const tb = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
      return tb - ta;
    });
  }

  // Paginación numerada con filtro server-side exacto (opción 2):
  // los UUID de la categoría salen del catálogo real (GET /api/v1/catalogs/event-types)
  // y cada página se pide al backend con event_type_id (un UUID por request).
  const loadPageFor = useCallback(
    async (target: number, type: 'all' | EventCategory): Promise<void> => {
      const my = ++listReq.current;
      setIsLoading(true);
      setLoadError(false);
      setLoadErrorStatus(null);
      const run = async (t: number): Promise<void> => {
        if (my !== listReq.current) return;
        const list = await profileService.fetchDevices();
        if (my !== listReq.current) return;
        const firstDevice = list[0] ?? null;
        setHasDevice(!!firstDevice);
        if (!firstDevice) {
          setEvents([]);
          setDeviceLabel('');
          setTotalPages(0);
          setTotalItems(0);
          return;
        }
        const did = firstDevice.id;
        setDeviceLabel(firstDevice.serialNumber || did.slice(0, 8));
        const from = toISOStart(fromDate);
        const to = toISOEnd(toDate);

        // UUIDs server-side; si el catálogo falla, degradado a filtro cliente (opción 1).
        let ids: string[] | null = null;
        let clientFallback = false;
        try {
          const cat = await eventsApi.getEventTypeCatalog();
          if (my !== listReq.current) return;
          setCatalog(cat);
          ids = categoryTypeIds(cat, type);
        } catch {
          if (my !== listReq.current) return;
          if (type !== 'all') clientFallback = true;
        }

        let rows: EventDetailDto[] = [];
        let total = 0;
        if (!clientFallback && ids !== null && ids.length === 0) {
          rows = [];
          total = 0;
        } else if (!clientFallback && ids !== null) {
          const need = t * PAGE_SIZE;
          if (need <= SERVER_PAGE_CAP) {
            // Ventana exacta: top need de cada tipo, merge global y corte de la página.
            const parts = await Promise.all(
              ids.map((id) =>
                eventsApi.listEventsPage({ deviceId: did, from, to, page: 1, pageSize: need, eventTypeId: id }),
              ),
            );
            if (my !== listReq.current) return;
            const merged = sortDesc(parts.flatMap((p) => p.data));
            total = parts.reduce((acc, p) => acc + p.pagination.totalItems, 0);
            rows = merged.slice((t - 1) * PAGE_SIZE, t * PAGE_SIZE);
          } else {
            // Páginas profundas más allá del cap: mejor esfuerzo por tipo.
            const parts = await Promise.all(
              ids.map((id) =>
                eventsApi.listEventsPage({ deviceId: did, from, to, page: t, pageSize: PAGE_SIZE, eventTypeId: id }),
              ),
            );
            if (my !== listReq.current) return;
            rows = sortDesc(parts.flatMap((p) => p.data));
            total = parts.reduce((acc, p) => acc + p.pagination.totalItems, 0);
          }
        } else {
          const p = await eventsApi.listEventsPage({ deviceId: did, from, to, page: t, pageSize: PAGE_SIZE });
          if (my !== listReq.current) return;
          let data = p.data;
          if (clientFallback) {
            data = data.filter((event) => {
              const category = eventCategoryOf(event.eventType?.code, event.eventType?.name);
              return category === type && isInRange(eventDateKey(event.occurredAt), fromDate, toDate);
            });
            total = data.length;
          } else {
            total = p.pagination.totalItems;
          }
          rows = data;
        }

        const pages = total === 0 ? 0 : Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (t > pages && pages > 0) {
          // La página quedó fuera de rango (datos reducidos): reintentar en la última.
          setPage(pages);
          return run(pages);
        }
        if (my !== listReq.current) return;
        setEvents(rows);
        setPage(t);
        setTotalPages(pages);
        setTotalItems(total);
      };
      try {
        await run(target);
      } catch (e) {
        if (my !== listReq.current) return;
        const status = e instanceof ApiError ? e.status : -1;
        if (__DEV__) console.log('[History] list error', status, e);
        setLoadError(true);
        setLoadErrorStatus(status);
      } finally {
        if (my !== listReq.current) return;
        setIsLoading(false);
      }
    },
    [fromDate, toDate],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPageFor(1, 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarga server-side con debounce cuando cambian las fechas (from/to -> query)
  useEffect(() => {
    if (isLoading) return;
    const id = setTimeout(() => {
      setPage(1);
      scrollTop();
      loadPageFor(1, selectedType);
    }, 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  function resetFilters() {
    setSelectedType('all');
    setFromDate('');
    setToDate('');
    setPage(1);
    scrollTop();
    // Forzar recarga (el efecto de fechas puede no disparar si ya estaban vacías)
    listReq.current++;
    setIsLoading(true);
    setLoadError(false);
    setLoadErrorStatus(null);
    loadPageFor(1, 'all');
  }

  function listErrorMessage(): string {
    // 400 = params inválidos (rango/fechas) -> mensaje de filtros, no técnico.
    if (loadErrorStatus === 400) return t('history.filters.noResults');
    if (loadErrorStatus === 401) return t('history.evidence.unauthorized');
    if (loadErrorStatus === 403) return t('history.evidence.forbidden');
    if (loadErrorStatus === 404) return t('history.filters.noResults');
    if (loadErrorStatus === 0) return t('history.evidence.network');
    return t('history.list.loadErrorMessage');
  }

  // Los eventos ya vienen filtrados del servidor (event_type_id + from/to);
  // solo se agrupan por día para el timeline.
  const groups = useMemo(() => {
    const map: Record<string, EventDetailDto[]> = {};
    events.forEach((e) => {
      const k = eventDateKey(e.occurredAt) || 'unknown';
      (map[k] ??= []).push(e);
    });
    return Object.keys(map)
      .sort((a, b) => (a === 'unknown' ? 1 : b === 'unknown' ? -1 : b.localeCompare(a)))
      .map((k) => ({ key: k, rows: map[k] }));
  }, [events]);

  // Icono por UUID exacto del catálogo; heurística local como respaldo.
  function catOf(event: EventDetailDto): EventCategory {
    if (catalog) {
      const exact = categoryOfTypeId(catalog, event.eventType?.id);
      if (exact) return exact;
    }
    return eventCategoryOf(event.eventType?.code, event.eventType?.name);
  }

  // Ventana de páginas: 1 … p-1 p p+1 … N (máx. 7 botones).
  function pageWindow(current: number, total: number): (number | '…')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set<number>([1, 2, current - 1, current, current + 1, total - 1, total]);
    const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
    const out: (number | '…')[] = [];
    let prev = 0;
    for (const n of nums) {
      if (prev && n - prev > 1) out.push('…');
      out.push(n);
      prev = n;
    }
    return out;
  }

  function goToPage(n: number) {
    if (n < 1 || n > totalPages || n === page || isLoading) return;
    setPage(n);
    scrollTop();
    loadPageFor(n, selectedType);
  }

  const hasFilters = selectedType !== 'all' || !!fromDate || !!toDate;
  // Validación local: pasado y presente, nada de futuro.
  // - Formato inválido o día futuro -> borde de error y se omite del query.
  // - Rango inválido (desde > hasta) -> mensaje inline; el query igual se envía
  //   y el backend responde vacío/400 (mapeado a noResults).
  const fromInvalid = fromDate.trim() !== '' && (!parseDateInput(fromDate) || isFutureDay(fromDate));
  const toInvalid = toDate.trim() !== '' && (!parseDateInput(toDate) || isFutureDay(toDate));
  const fromFuture = fromDate.trim() !== '' && isFutureDay(fromDate);
  const toFuture = toDate.trim() !== '' && isFutureDay(toDate);
  const rangeInvalid =
    !fromInvalid && !toInvalid && !!fromDate && !!toDate && eventDateKey(dateKeyToDate(fromDate).toISOString()) > eventDateKey(dateKeyToDate(toDate).toISOString());

  function onPickFrom(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowFrom(false);
      return;
    }
    if (date) {
      // Clamp defensivo: nunca futuro aunque el picker ya usa maximumDate
      const picked = new Date(date);
      const safe = picked > new Date() ? new Date() : picked;
      setFromDate(eventDateKey(safe.toISOString()));
    }
    setShowFrom(false);
  }

  function onPickTo(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowTo(false);
      return;
    }
    if (date) {
      const safe = new Date(date) > new Date() ? new Date() : date;
      setToDate(eventDateKey(new Date(safe).toISOString()));
    }
    setShowTo(false);
  }

  function hhmm(value: string | null): string {
    return formatEventTime(value);
  }

  function relTime(value: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    // eslint-disable-next-line react-hooks/purity
    const m = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
    if (m < 1) return t('history.relative.now');
    if (m < 60) return t('history.relative.minutesAgo', { count: m });
    const h = Math.floor(m / 60);
    if (h < 24) return t('history.relative.hoursAgo', { count: h });
    return t('history.relative.daysAgo', { count: Math.floor(h / 24) });
  }

  function dayLabel(key: string): string {
    if (key === 'unknown') return t('history.list.today');
    const now = new Date();
    const todayK = eventDateKey(now.toISOString());
    const y = new Date();
    y.setDate(now.getDate() - 1);
    const yesterdayK = eventDateKey(y.toISOString());
    if (key === todayK) return t('history.list.today');
    if (key === yesterdayK) return t('history.list.yesterday');
    const [Y, M, D] = key.split('-').map(Number);
    if (!Y || !M || !D) return key;
    try {
      const x = new Date(Y, M - 1, D).toLocaleDateString(i18n.language || 'es', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      return x.charAt(0).toUpperCase() + x.slice(1);
    } catch {
      return key;
    }
  }

  function fDate(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    try {
      return d.toLocaleDateString(i18n.language || 'es', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return d.toLocaleDateString();
    }
  }

  function fTime(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function severityLabel(code: string | null | undefined, fallback?: string | null): string {
    const key = (code ?? 'INFO').toUpperCase();
    const known = ['INFO', 'WARNING', 'HIGH', 'CRITICAL'].includes(key) ? key : 'INFO';
    const translated = t(`history.severity.${known}`, { defaultValue: fallback || known });
    return translated || fallback || known;
  }

  function evidenceMessage(status: number | null): string {
    if (status === 401) return t('history.evidence.unauthorized');
    if (status === 403) return t('history.evidence.forbidden');
    if (status === 404) return t('history.evidence.notFound');
    if (status === 502) return t('history.evidence.unavailable');
    if (status === 0) return t('history.evidence.network');
    return t('history.evidence.generic');
  }

  async function loadEvidence(event: EventDetailDto) {
    const my = ++evidenceReq.current;
    setEvidenceUri(null);
    setEvidenceStatus(null);
    if (!event.hasEvidence) {
      setEvidenceStatus(404);
      return;
    }
    setEvidenceLoading(true);
    try {
      // GET /api/v1/events/{eventId}/evidence (JWT) -> image/jpeg bytes
      const dataUrl = await eventsApi.fetchEvidenceDataUrl(event.id);
      if (my !== evidenceReq.current) return;
      setEvidenceUri(dataUrl);
    } catch (e) {
      if (my !== evidenceReq.current) return;
      const status = e instanceof ApiError ? e.status : -1;
      if (__DEV__) console.log(`[History] evidence ${event.id} -> ${status}`);
      setEvidenceStatus(status);
    } finally {
      if (my !== evidenceReq.current) return;
      setEvidenceLoading(false);
    }
  }

  function openEvent(event: EventDetailDto) {
    setSelectedEvent(event);
    loadEvidence(event);
  }

  function closeEvent() {
    evidenceReq.current++;
    setSelectedEvent(null);
    setEvidenceUri(null);
    setEvidenceStatus(null);
    setEvidenceLoading(false);
  }

  // ---------- Detalle (vista #detail del diseño) ----------
  if (selectedEvent) {
    const color = severityColor(selectedEvent.severity?.code);
    const code = selectedEvent.eventType?.code || selectedEvent.eventType?.name || '—';
    return (
      <Screen contentStyle={styles.screen}>
        <View style={styles.dhead}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} style={styles.iconBtn} onPress={closeEvent}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.dtitle} numberOfLines={1}>
            {selectedEvent.eventType?.code || code}
          </Text>
        </View>

        <View style={styles.media}>
          {evidenceLoading ? (
            <View style={styles.skelM}>
              <ActivityIndicator color={theme.colors.accent} />
            </View>
          ) : evidenceUri ? (
            <>
              <Image source={{ uri: evidenceUri }} style={styles.mediaImg} contentFit="cover" />
              <View style={[styles.mediaTag, { backgroundColor: color }]}>
                <Text style={styles.mediaTagText}>{severityLabel(selectedEvent.severity?.code, selectedEvent.severity?.name)}</Text>
              </View>
              <Text style={styles.mediaStamp}>
                {fDate(selectedEvent.occurredAt)} · {fTime(selectedEvent.occurredAt)}
              </Text>
            </>
          ) : (
            <View style={styles.mstate}>
              <Text style={styles.mstateText}>{evidenceMessage(evidenceStatus)}</Text>
              {selectedEvent.hasEvidence && (
                <AppButton title={t('history.evidence.retry')} variant="outline" onPress={() => loadEvidence(selectedEvent)} />
              )}
            </View>
          )}
        </View>

        <View style={styles.dl}>
          <View style={styles.dlRow}>
            <Text style={styles.dlDt}>{t('history.detail.type')}</Text>
            <Text style={styles.dlDd}>{selectedEvent.eventType?.name || selectedEvent.eventType?.code || '—'}</Text>
          </View>
          <View style={styles.dlRow}>
            <Text style={styles.dlDt}>{t('history.detail.severity')}</Text>
            <Text style={styles.dlDd}>{severityLabel(selectedEvent.severity?.code, selectedEvent.severity?.name)}</Text>
          </View>
          <View style={styles.dlRow}>
            <Text style={styles.dlDt}>{t('history.detail.date')}</Text>
            <Text style={styles.dlDd}>{fDate(selectedEvent.occurredAt)}</Text>
          </View>
          <View style={styles.dlRow}>
            <Text style={styles.dlDt}>{t('history.detail.time')}</Text>
            <Text style={styles.dlDd}>{fTime(selectedEvent.occurredAt)}</Text>
          </View>
          <View style={[styles.dlRow, styles.dlRowLast]}>
            <Text style={styles.dlDt}>{t('history.detail.device')}</Text>
            <Text style={styles.dlDd} numberOfLines={1}>
              {deviceLabel || t('history.detail.unknownDevice')}
            </Text>
          </View>
        </View>
      </Screen>
    );
  }

  // ---------- Lista (vista #home del diseño) ----------
  return (
    <Screen contentStyle={styles.screen} scrollRef={scrollRef}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>{t('history.title')}</Text>
          <Text style={styles.subtitle}>{t('history.subtitle')}</Text>
        </View>
      </View>

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {filterTypes.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => {
                if (item.id === selectedType) return;
                setSelectedType(item.id);
                setPage(1);
                scrollTop();
                loadPageFor(1, item.id);
              }}
              style={[styles.chip, selectedType === item.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedType === item.id && styles.chipTextActive]} numberOfLines={1}>
                {t(`history.filters.types.${item.id}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.dates}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>{t('history.filters.fromDate')}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setShowTo(false);
                setShowFrom(true);
              }}
              style={[styles.dateInput, styles.datePress, fromInvalid && styles.dateInputError]}
            >
              <Text style={[styles.dateValue, !fromDate && styles.datePlaceholder]} numberOfLines={1}>
                {fromDate || 'YYYY-MM-DD'}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>{t('history.filters.toDate')}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setShowFrom(false);
                setShowTo(true);
              }}
              style={[styles.dateInput, styles.datePress, toInvalid && styles.dateInputError]}
            >
              <Text style={[styles.dateValue, !toDate && styles.datePlaceholder]} numberOfLines={1}>
                {toDate || 'YYYY-MM-DD'}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={resetFilters} disabled={!hasFilters && !loadError} style={styles.clearBtn}>
            <Text style={[styles.clearText, !hasFilters && !loadError && styles.clearDisabled]}>{t('history.filters.clear')}</Text>
          </Pressable>
        </View>
        {(fromFuture || toFuture) && (
          <Text style={styles.dateError}>{t('history.filters.futureNotAllowed')}</Text>
        )}
        {!fromFuture && !toFuture && rangeInvalid && (
          <Text style={styles.dateError}>{t('history.filters.invalidRange')}</Text>
        )}
        {showFrom && (
          <DateTimePicker
            value={dateKeyToDate(fromDate)}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            maximumDate={new Date()}
            onChange={onPickFrom}
          />
        )}
        {showTo && (
          <DateTimePicker
            value={dateKeyToDate(toDate)}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            maximumDate={new Date()}
            onChange={onPickTo}
          />
        )}
      </View>

      <View style={styles.listWrap}>
        {isLoading ? (
          <>
            {[0, 1, 2, 3].map((k) => (
              <View key={k} style={styles.skel} />
            ))}
          </>
        ) : loadError ? (
          <View style={styles.state}>
            <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.stateTitle}>{t('history.list.loadErrorTitle')}</Text>
            <Text style={styles.stateText}>{listErrorMessage()}</Text>
            <View style={styles.stateBtn}>
              <AppButton title={t('common.retry')} variant="outline" onPress={() => loadPageFor(page, selectedType)} />
            </View>
          </View>
        ) : !hasDevice ? (
          <View style={styles.state}>
            <Ionicons name="phone-portrait-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.stateTitle}>{t('device.notLinked')}</Text>
            <View style={styles.stateBtn}>
              <AppButton title={t('device.goToAccount')} variant="confirm" onPress={() => router.push('/profile/cuenta' as any)} />
            </View>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.state}>
            <Ionicons name="search-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.stateTitle}>{t('history.empty.title')}</Text>
            <Text style={styles.stateText}>{t('history.empty.message')}</Text>
            <View style={styles.stateBtn}>
              <AppButton title={t('history.empty.clear')} variant="outline" onPress={resetFilters} />
            </View>
          </View>
        ) : (
          <>
            {groups.map((g) => (
              <View key={g.key} style={styles.day}>
                <View style={styles.dayHead}>
                  <Text style={styles.dayTitle}>{dayLabel(g.key)}</Text>
                  <Text style={styles.dayCount}>
                    {g.rows.length} {g.rows.length === 1 ? t('history.list.event') : t('history.list.events')}
                  </Text>
                </View>
                <View style={styles.timeline}>
                  <View style={styles.timelineLine} />
                  {g.rows.map((event) => {
                    const sev = toAlertSeverity(event.severity?.code);
                    const color = severityColor(event.severity?.code);
                    const category = catOf(event);
                    const code = event.eventType?.code || event.eventType?.name || '—';
                    return (
                      <View key={event.id} style={styles.ev}>
                        <View style={[styles.evDot, { backgroundColor: color }]} />
                        <View style={styles.evTop}>
                          <View style={[styles.evIco, { backgroundColor: getSeverityBg(sev, 0.18) }]}>
                            <Ionicons name={categoryIcon(category)} size={22} color={color} />
                          </View>
                          <View style={styles.evBody}>
                            <Text style={styles.evTitle} numberOfLines={1}>
                              {code}
                            </Text>
                            <Text style={[styles.evSev, { color, backgroundColor: getSeverityBg(sev, 0.16) }]} numberOfLines={1}>
                              {severityLabel(event.severity?.code, event.severity?.name)}
                            </Text>
                          </View>
                          <View style={styles.evTime}>
                            <Text style={styles.evTimeBig}>{hhmm(event.occurredAt)}</Text>
                            <Text style={styles.evTimeSmall}>{relTime(event.occurredAt)}</Text>
                          </View>
                        </View>
                        <View style={styles.evFoot}>
                          <Text style={[styles.evFlag, event.hasEvidence && styles.evFlagYes]}>
                            <View style={[styles.evFlagDot, event.hasEvidence && styles.evFlagDotYes]} />{' '}
                            {event.hasEvidence ? t('history.card.withEvidence') : t('history.card.withoutEvidence')}
                          </Text>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => openEvent(event)}
                            style={styles.evBtn}
                          >
                            <Text style={styles.evBtnText}>
                              {event.hasEvidence ? t('history.card.viewEvent') : t('history.card.details')}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
            <Text style={styles.pagerInfo}>
              {t('history.list.pageOf', { current: page, total: Math.max(totalPages, 1) })} · {totalItems}{' '}
              {totalItems === 1 ? t('history.list.event') : t('history.list.events')}
            </Text>
            {totalPages > 1 && (
              <View style={styles.pager}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('history.list.prev')}
                  onPress={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                >
                  <Ionicons name="chevron-back" size={18} color={page <= 1 ? theme.colors.textMuted : theme.colors.text} />
                </Pressable>
                {pageWindow(page, totalPages).map((n, i) =>
                  n === '…' ? (
                    <Text key={`e${i}`} style={styles.pageEllipsis}>
                      …
                    </Text>
                  ) : (
                    <Pressable
                      key={n}
                      accessibilityRole="button"
                      onPress={() => goToPage(n)}
                      disabled={n === page}
                      style={[styles.pageBtn, n === page && styles.pageBtnActive]}
                    >
                      <Text style={[styles.pageNum, n === page && styles.pageNumActive]}>{n}</Text>
                    </Pressable>
                  ),
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('history.list.next')}
                  onPress={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                >
                  <Ionicons name="chevron-forward" size={18} color={page >= totalPages ? theme.colors.textMuted : theme.colors.text} />
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const accentInk = '#04202a';
  return StyleSheet.create({
    screen: { padding: theme.spacing.lg, paddingTop: 0, gap: 14 },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 18, paddingBottom: 8 },
    headText: { flex: 1, paddingRight: 12 },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: theme.colors.text },
    subtitle: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2, fontWeight: '500' },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none' as any,
    },
    filters: { gap: 10, paddingBottom: 4 },
    chips: { gap: 8, paddingRight: 8, flexDirection: 'row' },
    chip: {
      flex: 'none' as any,
      flexDirection: 'row',
      alignItems: 'center',
      height: 38,
      paddingHorizontal: 14,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    chipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    chipText: { fontWeight: '700', fontSize: 13, color: theme.colors.text },
    chipTextActive: { color: accentInk },
    dates: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
    dateField: { flex: 1 },
    dateLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textMuted },
    dateInput: {
      width: '100%',
      height: 40,
      marginTop: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 10,
      fontWeight: '700',
      fontSize: 13,
      color: theme.colors.text,
    },
    dateInputError: { borderColor: theme.colors.error },
    datePress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    dateValue: { fontWeight: '700', fontSize: 13, color: theme.colors.text, flex: 1 },
    datePlaceholder: { color: theme.colors.placeholder, fontWeight: '500' },
    dateError: { fontSize: 12, fontWeight: '700', color: theme.colors.error },
    clearBtn: { height: 40, paddingHorizontal: 12, justifyContent: 'center' },
    clearText: { color: theme.colors.accent, fontWeight: '800', fontSize: 13, textDecorationLine: 'underline' },
    clearDisabled: { opacity: 0.35 },
    listWrap: { gap: 10, paddingBottom: 12 },
    day: { marginTop: 8 },
    dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginVertical: 10 },
    dayTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
    dayCount: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '700' },
    timeline: { position: 'relative', paddingLeft: 22, gap: 10 },
    timelineLine: { position: 'absolute', left: 6, top: 8, bottom: 8, width: 2, backgroundColor: theme.colors.border, borderRadius: 2 },
    ev: {
      position: 'relative',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      padding: 12,
    },
    evDot: { position: 'absolute', left: -22, top: 34, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: theme.colors.background },
    evTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    evIco: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flex: 'none' as any },
    evBody: { flex: 1, minWidth: 0 },
    evTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
    evSev: { marginTop: 3, fontSize: 11, fontWeight: '800', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start', overflow: 'hidden' },
    evTime: { alignItems: 'flex-end', flex: 'none' as any },
    evTimeBig: { fontSize: 20, fontWeight: '800', color: theme.colors.text, fontVariant: ['tabular-nums'] },
    evTimeSmall: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '600' },
    evFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border },
    evFlag: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted },
    evFlagYes: { color: theme.colors.accent },
    evFlagDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.textMuted },
    evFlagDotYes: { backgroundColor: theme.colors.accent },
    evBtn: { height: 40, paddingHorizontal: 18, borderRadius: 12, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
    evBtnText: { fontWeight: '800', fontSize: 14, color: accentInk },
    skel: { height: 116, borderRadius: 16, backgroundColor: theme.colors.input, marginBottom: 10, opacity: 0.7 },
    state: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20, gap: 12 },
    stateTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
    stateText: { fontSize: 13, color: theme.colors.textMuted, maxWidth: 280, lineHeight: 20, textAlign: 'center' },
    stateBtn: { width: '100%', maxWidth: 280, marginTop: 4 },
    pagerInfo: { marginTop: 14, fontSize: 12, color: theme.colors.textMuted, textAlign: 'center', fontWeight: '700' },
    pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
    pageBtn: {
      minWidth: 40,
      height: 40,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageBtnActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    pageBtnDisabled: { opacity: 0.4 },
    pageNum: { fontWeight: '800', fontSize: 14, color: theme.colors.text },
    pageNumActive: { color: accentInk },
    pageEllipsis: { fontSize: 14, fontWeight: '800', color: theme.colors.textMuted, paddingHorizontal: 2 },
    dhead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
    dtitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, flex: 1 },
    media: {
      position: 'relative',
      aspectRatio: 4 / 3,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: theme.colors.input,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mediaImg: { width: '100%', height: '100%' },
    mediaTag: { position: 'absolute', right: 10, top: 10, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10 },
    mediaTagText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    mediaStamp: {
      position: 'absolute',
      left: 12,
      bottom: 10,
      color: '#fff',
      fontSize: 12,
      fontWeight: '800',
      textShadowColor: 'rgba(0,0,0,0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    skelM: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.input },
    mstate: { padding: 20, gap: 12, alignItems: 'center', width: '100%' },
    mstateText: { fontSize: 13, color: theme.colors.textMuted, fontWeight: '600', textAlign: 'center' },
    dl: { marginTop: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 16 },
    dlRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    dlRowLast: { borderBottomWidth: 0 },
    dlDt: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 14 },
    dlDd: { fontWeight: '800', textAlign: 'right', fontSize: 14, color: theme.colors.text, flex: 1 },
  });
}
