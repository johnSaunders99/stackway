import type { Data, Stats } from './model';
import { shiftDay, studyDay } from './clock';
export function streaks(rows: Stats[], day: string) {
  const days = [...new Set(rows.filter(r => r.day <= day && (r.activeMinutes > 0 || r.lessonsDone > 0 || r.reviewsDone > 0)).map(r => r.day))].sort();
  let longest = 0,
    count = 0,
    last = '';
  for (const d of days) {
    count = last && shiftDay(last, 1) === d ? count + 1 : 1;
    longest = Math.max(longest, count);
    last = d;
  }
  return {
    longest,
    current: last === day || last === shiftDay(day, -1) ? count : 0
  };
}
export function forecast(cards: Data['cards'], day: string, hour: number) {
  return Array.from({
    length: 14
  }, (_, i) => {
    const d = shiftDay(day, i);
    return {
      day: d,
      count: cards.filter(c => !c.suspended && (i === 0 ? studyDay(c.card.due, hour) <= d : studyDay(c.card.due, hour) === d)).length
    };
  });
}
export const accuracy = (logs: Data['reviewLogs']) => logs.length ? Math.round(100 * logs.filter(l => l.rating !== 1).length / logs.length) : null;
