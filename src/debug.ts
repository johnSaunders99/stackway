import { db, exportAll, resetAll, mutate } from './db';
import type { Catalog } from './content/types';
import { setNow, advanceDays, studyDay, now, shiftDay } from './lib/clock';
import { newCard, schedule } from './lib/scheduler';
import { defaults, emptyStats, type StoredCard } from './lib/model';
import type { Grade } from 'ts-fsrs';
export function installDebug(cat: Catalog, getHour: () => number) {
  const today = () => studyDay(now(), getHour());
  const debug = {
    setNow,
    advanceDays,
    today,
    resetAll,
    dump: async () => (await exportAll()).data,
    contentInfo: () => ({
      version: cat.version,
      ...cat.counts
    }),
    seedDemo: async ({
      days = 30
    } = {}) => {
      if (!Number.isInteger(days) || days < 2 || days > 365) throw Error('請使用 2–365 天');
      await mutate(async () => {
        if ((await Promise.all(db.tables.filter(t => !['settings', 'dayStats'].includes(t.name)).map(t => t.count()))).some(Boolean) || (await db.dayStats.toArray()).some(d => d.day !== today())) throw Error('已有學習紀錄。請先匯出備份；若確定要清除，執行 resetAll()。');
        const end = today(),
          y = shiftDay(end, -1),
          lessons = cat.lessons.filter(l => l.status === 'ready').sort((a, b) => Number(!a.module.startsWith('fd-')) - Number(!b.module.startsWith('fd-')) || a.order - b.order).slice(0, 4);
        const cards: StoredCard[] = [];
        for (let i = 0; i < days; i++) {
          const d = shiftDay(end, i - days),
            at = new Date(d + 'T14:00:00'),
            st = emptyStats(d);
          st.activeMinutes = 18 + i * 13 % 65;
          const idx = Math.floor(i * lessons.length / days),
            l = lessons[idx];
          if (l && !(await db.lessonProgress.get(l.id))) {
            await db.lessonProgress.put({
              lessonId: l.id,
              status: 'done',
              startedAt: at.toISOString(),
              completedAt: at.toISOString(),
              scrollY: 0,
              quizResult: {}
            });
            st.lessonsDone++;
            for (const c of cat.concepts.filter(c => c.lessonId === l.id)) cards.push(newCard(c, d, at, 3, .9,getHour()));
          }
          for (const [j, c] of cards.entries()) {
            if ((i + j) % 3 === 0) {
              const g: Grade = (i + j) % 5 === 0 ? 1 : 3;
              c.card = schedule(c.card, g, at, .9);
              await db.reviewLogs.add({
                id: crypto.randomUUID(),
                conceptId: c.conceptId,
                day: d,
                format: 'flashcard',
                rating: g,
                elapsedMs: 8000 + j * 500,
                ts: at.toISOString()
              });
              st.reviewsDone++;
            }
          }
          await db.dayStats.put(st);
        }
        cards.forEach((c, i) => {
          c.card.due = new Date(+now() + (i % 5 - 2) * 86400000 - 60000);
        });
        await db.cards.bulkPut(cards);
        const s = (await db.settings.get('main')) ?? defaults;
        await db.settings.put({
          ...s,
          onboarded: true
        });
        await db.dayPlans.put({
          day: y,
          budget: s.budget,
          focus: 'recommended',
          format: 'flashcard',
          scope: 'due',
          tracks: s.tracks,
          items: [],
          reviewDone: [],
          reviewIds: [],
          createdAt: y + 'T12:00:00',
          closedAt: y + 'T15:00:00',
          nextReview: {
            day: end,
            format: 'interview',
            scope: 'due',
            tracks: s.tracks
          }
        });
      });
    }
  };
  Object.assign(window, {
    stackway: {
      debug
    }
  });
}
