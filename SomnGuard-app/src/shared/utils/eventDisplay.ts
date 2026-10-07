import { AlertSeverity, type AlertSeverityType } from '@/shared/theme/theme';

export type EventCategory = 'sleepiness' | 'distraction' | 'eyeClosure' | 'other';

// Mapea SeverityRef.code del backend a la paleta de la app
export function toAlertSeverity(code: string | null | undefined): AlertSeverityType {
  const key = (code ?? 'INFO').toUpperCase();
  if (key === 'INFO' || key === 'WARNING' || key === 'HIGH' || key === 'CRITICAL') return key;
  return 'INFO';
}

export function severityColor(code: string | null | undefined): string {
  return AlertSeverity[toAlertSeverity(code)];
}

// Clasifica EventTypeRef (code/name) en las categorías de Historial
export function eventCategoryOf(code: string | null | undefined, name: string | null | undefined): EventCategory {
  const hay = `${code ?? ''} ${name ?? ''}`.toLowerCase();
  if (/(eye|ocular|ojo|cierre|closure|blink|parpadeo|eyelid)/.test(hay)) return 'eyeClosure';
  if (/(sleep|somno|drows|microsleep|fatigue|bostezo|yawn|cabeceo)/.test(hay)) return 'sleepiness';
  if (/(distract|gaze|mirada|phone|telefono|teléfono|celular|desvio|desvío|atencion|atención)/.test(hay)) return 'distraction';
  return 'other';
}

export type CatalogTypeRef = {
  id: string | null;
  code: string | null;
  name: string | null;
};

function isEyeType(code: string | null | undefined, name: string | null | undefined): boolean {
  const hay = `${code ?? ''} ${name ?? ''}`.toLowerCase();
  return /(eye|ocular|ojo|cierre|closure|blink|parpadeo|eyelid)/.test(hay);
}

// Resuelve los event_type_id (UUID) del catálogo real para cada chip del Historial.
// Mapeo por prefijo de código (coincide con event_category del backend):
//   EV-DIS-* -> distraction · EV-SOM-* de ojos -> eyeClosure · EV-SOM-* resto -> sleepiness
//   resto (EV-CIN-*, EV-SYS-*, futuros) -> other · 'all' -> null (sin filtro).
export function categoryTypeIds(catalog: CatalogTypeRef[], category: EventCategory | 'all'): string[] | null {
  if (category === 'all') return null;
  const ids: string[] = [];
  for (const t of catalog) {
    if (!t.id) continue;
    const code = (t.code ?? '').toUpperCase();
    if (category === 'distraction') {
      if (code.startsWith('EV-DIS-')) ids.push(t.id);
    } else if (category === 'sleepiness') {
      if (code.startsWith('EV-SOM-') && !isEyeType(t.code, t.name)) ids.push(t.id);
    } else if (category === 'eyeClosure') {
      if (code.startsWith('EV-SOM-') && isEyeType(t.code, t.name)) ids.push(t.id);
    } else {
      if (!code.startsWith('EV-DIS-') && !code.startsWith('EV-SOM-')) ids.push(t.id);
    }
  }
  return ids;
}

// Categoría exacta por UUID del catálogo (para iconos); null si no está en el catálogo.
export function categoryOfTypeId(catalog: CatalogTypeRef[], id: string | null | undefined): EventCategory | null {
  if (!id) return null;
  const found = catalog.find((t) => t.id === id);
  if (!found) return null;
  const code = (found.code ?? '').toUpperCase();
  if (code.startsWith('EV-DIS-')) return 'distraction';
  if (code.startsWith('EV-SOM-')) return isEyeType(found.code, found.name) ? 'eyeClosure' : 'sleepiness';
  return 'other';
}

export function categoryIcon(category: EventCategory): 'warning-outline' | 'moon-outline' | 'eye-off-outline' | 'ellipse-outline' {
  if (category === 'sleepiness') return 'moon-outline';
  if (category === 'eyeClosure') return 'eye-off-outline';
  if (category === 'distraction') return 'warning-outline';
  return 'ellipse-outline';
}

export function formatEventTime(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function eventDateKey(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
