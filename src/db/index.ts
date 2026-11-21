import Dexie, { type Table } from 'dexie';
import type { Data, Settings, DayPlan, Progress, StoredCard, Log, Stats, TaskRecord, ProjectRecord, Answer } from '../lib/model';
import { defaults, emptyStats } from '../lib/model';
import { now, wall } from '../lib/clock';
import { newCard, schedule } from '../lib/scheduler';
import type { Catalog, Lesson } from '../content/types';
import type { Grade } from 'ts-fsrs';
import { validate } from './validate';
export { validate };
const schema = {
  settings: 'id',
  lessonProgress: 'lessonId,status',
  cards: 'conceptId,lessonId,trackId',
  reviewLogs: 'id,day,conceptId',
  dayPlans: 'day',
  dayStats: 'day',
  practice: 'taskId',
  projects: 'projectId',
  interviewAnswers: 'id,questionId'
};
export const names = Object.keys(schema) as (keyof Data)[];
class Store extends Dexie {
  settings!: Table<Settings, string>;
  lessonProgress!: Table<Progress, string>;
  cards!: Table<StoredCard, string>;
  reviewLogs!: Table<Log, string>;
  dayPlans!: Table<DayPlan, string>;
  dayStats!: Table<Stats, string>;
  practice!: Table<TaskRecord, string>;
  projects!: Table<ProjectRecord, string>;
  interviewAnswers!: Table<Answer, string>;
  constructor() {
    super('stackway');
    this.version(1).stores(schema);
  }
}
export const db = new Store();
export const realStamp = () => new Date(wall()).toISOString();
export async function readData(): Promise<Data> {
  return db.transaction('r', db.tables, async () => Object.fromEntries(await Promise.all(names.map(async n => [n, await db.table(n).toArray()])))) as Promise<Data>;
}
export interface Snapshot {
  app: 'stackway';
  schemaVersion: 1;
  exportedAt: string;
  data: Data;
}
export async function exportAll(): Promise<Snapshot> {
  return {
    app: 'stackway',
    schemaVersion: 1,
    exportedAt: realStamp(),
    data: await readData()
  };
}
export function importAll(raw: unknown) {
  const snap = validate(raw);
  return db.transaction('rw', db.tables, async () => {
    for (const n of names) {
      await db.table(n).clear();
      await db.table(n).bulkAdd(snap.data[n]);
    }
  });
}
export async function mutate<T>(fn: () => Promise<T>) {
  return db.transaction('rw', db.tables, async () => {
    const result = await fn();
    const s = (await db.settings.get('main')) ?? defaults;
    await db.settings.put({
      ...s,
      modifiedAt: realStamp()
    });
    return result;
  });
}
export const settingsUpdate = (change: Partial<Settings>) => mutate(async () => {
  await db.settings.put({
    ...defaults,
    ...(await db.settings.get('main')),
    ...change
  });
});
export const resetAll = () => mutate(async () => {
  for (const t of db.tables) await t.clear();
});
export const resetProgress = () => mutate(async () => {
  for (const t of db.tables) if (t.name !== 'settings') await t.clear();
  const current = await db.settings.get('main');
  if (current) {
    const {
      nextReview,
      ...keep
    } = current;
    await db.settings.put(keep);
  }
});
export const putPlan = (p: DayPlan) => mutate(() => db.dayPlans.put(p));
export const editPlan = (day: string, fn: (p: DayPlan) => DayPlan) => mutate(async () => {
  const p = await db.dayPlans.get(day);
  if (p) await db.dayPlans.put(fn(p));
});
export const trackMinutes = (day: string, minutes: number) => mutate(async () => {
  const s = (await db.dayStats.get(day)) ?? emptyStats(day);
  await db.dayStats.put({
    ...s,
    activeMinutes: s.activeMinutes + minutes
  });
});
export function openLesson(id: string) {
  return mutate(async () => {
    if (!(await db.lessonProgress.get(id))) await db.lessonProgress.add({
      lessonId: id,
      status: 'started',
      scrollY: 0,
      quizResult: {},
      startedAt: now().toISOString()
    });
  });
}
export function completeLesson(l: Lesson, cat: Catalog, day: string, s: Settings) {
  return mutate(async () => {
    const p = await db.lessonProgress.get(l.id);
    if (!p || p.status === 'done') return;
    const at = now();
    await db.lessonProgress.put({
      ...p,
      status: 'done',
      completedAt: at.toISOString(),
      scrollY: 0
    });
    for (const c of cat.concepts.filter(c => c.lessonId === l.id)) if (!(await db.cards.get(c.id))) await db.cards.add(newCard(c, day, at, s.quizSchedule && p.quizResult[c.id] === false ? 1 : 3, s.retention,s.dayStartHour));
    const st = (await db.dayStats.get(day)) ?? emptyStats(day);
    await db.dayStats.put({
      ...st,
      lessonsDone: st.lessonsDone + 1
    });
  });
}
export interface Undo {
  day: string;
  cards: StoredCard[];
  logs: string[];
  answer?: string;
  planAdded: string[];
}
export function rate(ids: string[], rating: Grade | null, format: Log['format'], elapsedMs: number, day: string, s: Settings, answer?: Omit<Answer, 'id' | 'ts'>, relearning=false): Promise<Undo> {
  return mutate(async () => {
    const at = now(),
      ts = at.toISOString(),
      undo: Undo = {
        day,
        cards: [],
        logs: [],
        planAdded: []
      };
    // Recheck inside the transaction: another session may have used the remaining slots.
    const st = (await db.dayStats.get(day)) ?? emptyStats(day);
    const retries=await db.reviewLogs.where('day').equals(day).filter(log=>!!log.relearning).count();
    const admitted = rating === null || relearning ? ids : ids.slice(0, Math.max(0, s.cap - st.reviewsDone + retries));
    if (rating !== null) for (const id of admitted) {
      const c = await db.cards.get(id);
      if (!c || c.suspended) continue;
      undo.cards.push(c);
      await db.cards.put({
        ...c,
        card: schedule(c.card, rating, at, s.retention)
      });
      const lid = crypto.randomUUID();
      undo.logs.push(lid);
      await db.reviewLogs.add({
        id: lid,
        conceptId: id,
        ...(relearning?{relearning:true}:{}),
        day,
        format,
        rating,
        elapsedMs: Math.max(0, Math.round(elapsedMs / admitted.length)),
        ts
      });
    }
    if (answer) {
      undo.answer = crypto.randomUUID();
      await db.interviewAnswers.add({
        ...answer,
        id: undo.answer,
        ts
      });
    }
    const p = await db.dayPlans.get(day);
    if (p && !p.closedAt) {
      undo.planAdded = (rating === null ? admitted : undo.cards.map(c => c.conceptId)).filter(id => p.reviewIds.includes(id) && !p.reviewDone.includes(id));
      await db.dayPlans.put({
        ...p,
        reviewDone: [...p.reviewDone, ...undo.planAdded]
      });
    }
    if (undo.logs.length) {
      await db.dayStats.put({
        ...st,
        reviewsDone: st.reviewsDone + undo.logs.length
      });
    }
    return undo;
  });
}
export function undoRating(u: Undo) {
  return mutate(async () => {
    await db.cards.bulkPut(u.cards);
    await db.reviewLogs.bulkDelete(u.logs);
    if (u.answer) await db.interviewAnswers.delete(u.answer);
    const p = await db.dayPlans.get(u.day);
    if (p) await db.dayPlans.update(u.day, {
      reviewDone: p.reviewDone.filter(id => !u.planAdded.includes(id))
    });
    const st = await db.dayStats.get(u.day);
    if (st) await db.dayStats.update(u.day, {
      reviewsDone: Math.max(0, st.reviewsDone - u.logs.length)
    });
  });
}
