import 'fake-indexeddb/auto';
import { beforeEach, it, expect, beforeAll } from 'vitest';
import { webcrypto } from 'node:crypto';
import { inspect } from '../tools/content.mjs';
import { db, names, exportAll, importAll, mutate, settingsUpdate, readData, rate, undoRating, openLesson, completeLesson, putPlan, validate } from '../src/db';
import { now, studyDay } from '../src/lib/clock';
import { defaults } from '../src/lib/model';
import { installDebug } from '../src/debug';
import type { Catalog } from '../src/content/types';
const r = inspect('fixtures/content'),
  cat: Catalog = {
    ...r.index,
    concepts: r.deck.concepts,
    questions: []
  },
  l = cat.lessons.find(l => l.id === 'fd-demo-01-files')!,
  day = '2026-11-20';
beforeAll(() => {
  if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto
  });
  if (!globalThis.CustomEvent) Object.assign(globalThis, {
    CustomEvent: class extends Event {}
  });
});
beforeEach(async () => {
  await db.transaction('rw', db.tables, async () => {
    for (const n of names) await db.table(n).clear();
  });
});
async function learn() {
  await settingsUpdate({
    onboarded: true
  });
  await openLesson(l.id);
  await db.lessonProgress.update(l.id, {
    quizResult: {
      [l.concepts[0]]: false
    }
  });
  await completeLesson(l, cat, day, defaults);
}
it('completing twice creates one card per concept and counts one lesson', async () => {
  await learn();
  await completeLesson(l, cat, day, defaults);
  expect(await db.cards.count()).toBe(3);
  expect((await db.dayStats.get(day))?.lessonsDone).toBe(1);
  const cs = await db.cards.toArray();
  expect(cs.every(c => c.card.reps === 1)).toBe(true);
});
it('quiz switch changes the first schedule for a failed check', async () => {
  await learn();
  const weak = await db.cards.get(l.concepts[0]);
  await db.cards.clear();
  await db.lessonProgress.update(l.id, {
    status: 'started'
  });
  await completeLesson(l, cat, day, {
    ...defaults,
    quizSchedule: false
  });
  const good = await db.cards.get(l.concepts[0]);
  expect(weak!.card.stability).toBeLessThan(good!.card.stability);
});
it('JSON export → validated replace → export retains every table and revives FSRS dates', async () => {
  await learn();
  const ids = l.concepts;
  await db.practice.put({
    taskId: l.practice[0].id,
    notes: '保留這行',
    status: [true, false]
  });
  await db.projects.put({
    projectId: 'proj-notebook',
    done: ['m1:0'],
    repoUrl: '',
    notes: '本機草稿'
  });
  await rate(ids.slice(0, 1), 2, 'interview', 1300, day, defaults, {
    questionId: ids[0],
    text: '自己的答案',
    coverage: .5
  });
  await putPlan({
    day,
    budget: defaults.budget,
    focus: 'dual',
    format: 'mixed',
    scope: 'due',
    tracks: defaults.tracks,
    reviewIds: ids,
    reviewDone: [],
    items: [l.id],
    createdAt: now().toISOString()
  });
  const a = await exportAll();
  expect(names.every(n => a.data[n].length > 0)).toBe(true);
  await db.projects.put({
    projectId: 'should-be-replaced',
    done: [],
    repoUrl: '',
    notes: ''
  });
  await importAll(JSON.parse(JSON.stringify(a)));
  const b = await exportAll();
  expect(b.data).toEqual(a.data);
  expect(b.data.cards[0].card.due).toBeInstanceOf(Date);
  expect(b.data.cards[0].card.last_review).toBeInstanceOf(Date);
});
it.each(['schema', 'duplicate', 'bad-date', 'bad-settings', 'bad-log', 'missing-table'])('refuses %s before replacing anything', async bad => {
  await learn();
  const old = await exportAll(),
    raw = JSON.parse(JSON.stringify(old));
  if (bad === 'schema') raw.schemaVersion = 2;
  if (bad === 'duplicate') raw.data.cards.push(raw.data.cards[0]);
  if (bad === 'bad-date') raw.data.cards[0].card.due = 'never';
  if (bad === 'bad-settings') raw.data.settings[0].cap = -5;
  if (bad === 'bad-log') raw.data.reviewLogs.push({
    id: 'x'
  });
  if (bad === 'missing-table') delete raw.data.projects;
  expect(() => validate(raw)).toThrow();
  expect(await readData()).toEqual(old.data);
});
it('atomically undoes grouped ratings, plan state, counters and interview history', async () => {
  await learn();
  await putPlan({
    day,
    budget: defaults.budget,
    focus: 'dual',
    format: 'hands-on',
    scope: 'due',
    tracks: defaults.tracks,
    reviewIds: l.concepts,
    reviewDone: [],
    items: [l.id],
    createdAt: now().toISOString()
  });
  const old = await readData();
  const u = await rate(l.concepts, 2, 'hands-on', 1500, day, defaults, {
    questionId: 'q',
    text: '草稿',
    coverage: .5
  });
  expect(await db.reviewLogs.count()).toBe(3);
  expect((await db.dayPlans.get(day))?.reviewDone).toEqual(l.concepts);
  await undoRating(u);
  const fresh = await readData();
  expect({
    ...fresh,
    settings: old.settings
  }).toEqual(old);
});
it('applies the remaining daily slots at write time; extra interview answers are still saved', async () => {
  await learn();
  const s = {...defaults, cap: 1};
  const first = await rate(l.concepts, 3, 'hands-on', 1000, day, s);
  const extra = await rate([l.concepts[1]], 3, 'interview', 900, day, s, {questionId:l.concepts[1],text:'額外練習',coverage:1});
  expect(first.logs).toHaveLength(1);
  expect(extra.logs).toHaveLength(0);
  expect(await db.interviewAnswers.count()).toBe(1);
  expect((await db.dayStats.get(day))?.reviewsDone).toBe(1);
});
it('a committed relearning attempt reschedules once without spending a second initial slot; undo restores the Again state',async()=>{
 await learn();const s={...defaults,cap:2},id=l.concepts[0]
 await rate([id],1,'flashcard',900,day,s);const afterAgain=await db.cards.get(id)
 const u=await rate([id],3,'flashcard',1000,day,s,undefined,true)
 expect((await db.reviewLogs.get(u.logs[0]))?.relearning).toBe(true)
 expect((await db.cards.get(id))!.card.reps).toBe(afterAgain!.card.reps+1)
 const second=await rate([l.concepts[1]],3,'flashcard',900,day,s);expect(second.logs).toHaveLength(1)
 await undoRating(u);expect(await db.cards.get(id)).toEqual(afterAgain);expect((await db.dayStats.get(day))?.reviewsDone).toBe(2)
});
it('skipping a practice item leaves FSRS and logs alone', async () => {
  await learn();
  const old = await db.cards.toArray();
  await rate(l.concepts, null, 'hands-on', 4000, day, defaults);
  expect(await db.cards.toArray()).toEqual(old);
  expect(await db.reviewLogs.count()).toBe(0);
});
it('standalone interviews save the answer without inventing a concept card', async () => {
  await rate([], 3, 'interview', 1200, day, defaults, {
    questionId: 'iv-test',
    text: '原始回答',
    coverage: 1
  });
  expect(await db.interviewAnswers.count()).toBe(1);
  expect(await db.cards.count()).toBe(0);
  expect(await db.reviewLogs.count()).toBe(0);
});
it('seeds rich demo history, a next-day choice and protects existing records', async () => {
  const w = globalThis as unknown as {
    window: {
      stackway: {
        debug: {
          seedDemo: (x: {
            days: number;
          }) => Promise<void>;
          today: () => string;
          resetAll: () => Promise<void>;
        };
      };
    };
  };
  w.window = {} as typeof w.window;
  installDebug(cat, () => 4);
  const d = w.window.stackway.debug;
  await d.seedDemo({
    days: 30
  });
  const a = await readData();
  expect(a.dayStats).toHaveLength(30);
  expect(a.reviewLogs.length).toBeGreaterThan(30);
  expect(a.dayPlans[0].nextReview?.day).toEqual(d.today());
  expect(a.cards.some(c => +c.card.due > +now())).toBe(true);
  expect(new Set(a.cards.map(c => c.card.state)).size).toBeGreaterThan(1);
  await expect(d.seedDemo({
    days: 30
  })).rejects.toThrow();
  await d.resetAll();
  expect(await db.cards.count()).toBe(0);
});
