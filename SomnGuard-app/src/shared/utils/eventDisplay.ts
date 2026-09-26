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
