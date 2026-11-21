let override: number | null = null;
const listeners = new Set<() => void>();
export const wall = () => Date.now();
export const now = () => new Date(override ?? wall());
export const overridden = () => override !== null;
export function setNow(iso: string | null) {
  const n = iso === null ? null : Date.parse(iso);
  if (n !== null && !Number.isFinite(n)) throw Error('日期格式不符');
  override = n;
  listeners.forEach(f => f());
}
export function onClock(f: () => void) {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}
export function dateKey(d: Date) {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
export function studyDay(date: Date, hour: number) {
  const d = new Date(date);
  if (d.getHours() < hour) d.setDate(d.getDate() - 1);
  return dateKey(d);
}
export function shiftDay(day: string, n: number) {
  const d = new Date(day + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
export function advanceDays(n: number) {
  if (!Number.isInteger(n)) throw Error('天數必須是整數');
  const d = now();
  d.setDate(d.getDate() + n);
  setNow(d.toISOString());
}
