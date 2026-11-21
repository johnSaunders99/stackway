import { createEmptyCard, fsrs, type Grade } from 'ts-fsrs';
import type { Catalog, Concept, Practice } from '../content/types';
import type { Choice, StoredCard, Settings, Format } from './model';
import { catalogIndex } from '../content/catalog';
import { shiftDay, studyDay } from './clock';
export const flashRating = (value: Grade) => value;
export const quizRating = (correct: boolean, guess = false): Grade => correct ? guess ? 2 : 3 : 1;
export const interviewRating = (ratio: number): Grade => ratio >= .8 ? 3 : ratio >= .5 ? 2 : 1;
export const taskRating = (result: 'done' | 'partial' | 'failed' | 'skip') => ({
  done: 3,
  partial: 2,
  failed: 1,
  skip: null
} as const)[result];
export function schedule(old: StoredCard['card'] | null, grade: Grade, at: Date, retention: number) {
  return fsrs({
    request_retention: retention,
    enable_fuzz: true
  }).next(old ?? createEmptyCard(at), at, grade).card;
}
export function newCard(c: Concept, day: string, at: Date, rating: Grade, retention: number, dayStartHour=4): StoredCard {
  // Keep FSRS learning state/stability, but the first regular review belongs to the next study day.
  // With 5.2.3, raw short steps are only 1/10 minutes for Again/Good.
  const card=schedule(null,rating,at,retention);
  card.due=new Date(shiftDay(day,1)+'T00:00:00');card.due.setHours(dayStartHour,0,0,0);
  return {
    conceptId: c.id,
    lessonId: c.lessonId,
    trackId: c.trackId,
    firstLearnedDay: day,
    suspended: false,
    card
  };
}
export function rng(seed: string) {
  let x = 2166136261;
  for (const c of seed) x = Math.imul(x ^ c.charCodeAt(0), 16777619);
  return () => {
    x = Math.imul(1664525, x) + 1013904223 >>> 0;
    return x / 4294967296;
  };
}
export function shuffled<T>(xs: T[], seed: string) {
  const a = [...xs],
    r = rng(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function pickFormat(f: Format, c: Concept, seed: string, w: Settings['weights']): Exclude<Format, 'mixed'> {
  if (f === 'mixed') {
    const weights = [w[0], c.mcq ? w[1] : 0, c.interview ? w[2] : 0];
    let n = rng(seed + ':' + c.id)() * weights.reduce((a, b) => a + b, 0);
    for (const [i, v] of weights.entries()) {
      n -= v;
      if (n < 0) return (['flashcard', 'quiz', 'interview'] as const)[i];
    }
    return 'flashcard';
  }
  return f === 'quiz' && !c.mcq || f === 'interview' && !c.interview ? 'flashcard' : f;
}
export interface ReviewItem {
  ids: string[];
  format: Exclude<Format, 'mixed'>;
  task?: Practice;
  fallback?: 'quiz'|'interview'|'hands-on';
  relearning?: boolean;
}
export function present(ids: string[], choice: Choice, cat: Catalog, day: string, weights: Settings['weights']) {
  const items: ReviewItem[] = [],
    tasks = new Map<string, ReviewItem>();
  for (const id of ids) {
    const c = catalogIndex(cat).concepts.get(id);
    if (!c) continue;
    let format = pickFormat(choice.format, c, day, weights);
    if (format === 'hands-on') {
      const task = catalogIndex(cat).lessons.get(c.lessonId)?.practice[0];
      if (task) {
        const prev = tasks.get(task.id);
        if (prev) prev.ids.push(id);else {
          const item = {
            format,
            task,
            ids: [id]
          };
          items.push(item);
          tasks.set(task.id, item);
        }
        continue;
      }
      format = 'flashcard';
    }
    items.push({
      format,
      ids: [id],
      ...(format==='flashcard' && (choice.format==='quiz'||choice.format==='interview'||choice.format==='hands-on') ? {fallback:choice.format} : {})
    });
  }
  return items;
}
export function queue(cards: StoredCard[], choice: Choice, at: Date, s: Pick<Settings, 'cap' | 'dayStartHour'>, ahead = false, used = 0) {
  const day = studyDay(at, s.dayStartHour),
    due = (c: StoredCard) => +c.card.due <= +at;
  const candidates = cards.filter(c => !c.suspended && (ahead || due(c) || choice.scope === 'weak' && (c.card.lapses > 0 || (!(c.card.reps===1 && c.firstLearnedDay===day) && (c.card.state === 1 || c.card.state === 3)))) && (choice.scope !== 'tracks' || choice.tracks.includes(c.trackId)) && (choice.scope !== 'yesterday' || c.firstLearnedDay === shiftDay(day, -1))).sort((a, b) => (choice.scope === 'weak' ? b.card.lapses - a.card.lapses || a.card.stability - b.card.stability : 0) || +a.card.due - +b.card.due || a.conceptId.localeCompare(b.conceptId));
  const cap = Math.max(0, s.cap - used);
  return {
    ids: candidates.slice(0, cap).map(c => c.conceptId),
    carry: candidates.slice(cap).filter(due).length
  };
}
export function estimate(items: ReviewItem[]) {
  return items.reduce((n, x) => n + (x.format === 'hands-on' ? x.task?.minutes ?? 0 : x.format === 'interview' ? 2.5 : x.format === 'quiz' ? .5 : .35), 0);
}
