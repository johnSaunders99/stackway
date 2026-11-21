import type { Snapshot } from './index';
const fail = (): never => {
  throw Error('備份格式不符，原有資料未更動。');
};
const obj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const str = (x: unknown): x is string => typeof x === 'string';
const strings = (x: unknown) => Array.isArray(x) && x.every(str);
const num = (x: unknown, lo = 0, hi = Infinity) => typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi;
const int = (x: unknown, lo: number, hi = Infinity) => num(x, lo, hi) && Number.isInteger(x);
const one = (x: unknown, choices: string) => str(x) && choices.split('|').includes(x);
const date = (x: unknown) => str(x) && Number.isFinite(Date.parse(x));
const day = (x: unknown) => str(x) && /^\d{4}-\d{2}-\d{2}$/.test(x) && date(x);
const budget = (x: unknown) => obj(x) && one(x.mode, 'time|count') && int(x.value, 1);
const fmt = 'flashcard|quiz|interview|hands-on|mixed',
  focus = 'recommended|dual|fullstack|aiinfra',
  tracks = 'foundations|fullstack|aiinfra|career';
const choice = (x: Record<string, unknown>) => one(x.format, fmt) && one(x.scope, 'due|yesterday|tracks|weak') && Array.isArray(x.tracks) && x.tracks.every(t => one(t, tracks));
const tomorrow = (x: unknown) => x === undefined || obj(x) && choice(x) && day(x.day) && (x.budget === undefined || budget(x.budget));
const bool = (x: unknown) => typeof x === 'boolean';
const keys = {
  settings: 'id',
  lessonProgress: 'lessonId',
  cards: 'conceptId',
  reviewLogs: 'id',
  dayPlans: 'day',
  dayStats: 'day',
  practice: 'taskId',
  projects: 'projectId',
  interviewAnswers: 'id'
};
export function validate(raw: unknown): Snapshot {
  if (!obj(raw) || raw.app !== 'stackway' || raw.schemaVersion !== 1 || !date(raw.exportedAt) || !obj(raw.data)) return fail();
  const data: Record<string, unknown[]> = {};
  for (const [n, key] of Object.entries(keys)) {
    const rows = raw.data[n];
    if (!Array.isArray(rows)) return fail();
    const seen = new Set();
    data[n] = rows.map(r => {
      if (!obj(r) || !str(r[key]) || !r[key] || seen.has(r[key])) return fail();
      seen.add(r[key]);
      let ok = false;
      switch (n) {
        case 'settings':
          ok = r.id === 'main' && choice(r) && budget(r.budget) && one(r.focus, focus) && one(r.ratio, '1:1|2:1|1:2') && int(r.cap, 1) && num(r.retention, .8, .95) && int(r.dayStartHour, 0, 23) && Array.isArray(r.weights) && r.weights.length === 3 && r.weights.every(w => num(w)) && r.weights.some(w => w > 0) && one(r.theme, 'light|dark|system') && one(r.font, 'small|medium|large') && one(r.width, 'narrow|standard|wide') && [r.onboarded, r.quizSchedule, r.reduceMotion].every(bool) && date(r.modifiedAt) && tomorrow(r.nextReview);
          break;
        case 'cards':
          {
            const c = r.card;
            if (!obj(c) || !str(r.lessonId) || !one(r.trackId, tracks) || !day(r.firstLearnedDay) || !bool(r.suspended) || !int(c.state, 0, 3) || !['stability', 'difficulty', 'elapsed_days', 'scheduled_days', 'learning_steps', 'reps', 'lapses'].every(k => num(c[k]))) return fail();
            const asDate = (v: unknown) => v instanceof Date && Number.isFinite(+v) ? new Date(v) : date(v) ? new Date(String(v)) : fail();
            return {
              ...r,
              card: {
                ...c,
                due: asDate(c.due),
                ...(c.last_review != null ? {
                  last_review: asDate(c.last_review)
                } : {})
              }
            };
          }
        case 'lessonProgress':
          ok = one(r.status, 'started|done|skipped') && date(r.startedAt) && num(r.scrollY) && obj(r.quizResult) && Object.values(r.quizResult).every(bool) && (!r.completedAt || date(r.completedAt));
          break;
        case 'dayPlans':
          ok = day(r.day) && budget(r.budget) && choice(r) && one(r.focus, focus) && [r.items, r.reviewIds, r.reviewDone].every(strings) && date(r.createdAt) && (!r.closedAt || date(r.closedAt)) && tomorrow(r.nextReview);
          break;
        case 'dayStats':
          ok = day(r.day) && num(r.activeMinutes) && int(r.lessonsDone, 0) && int(r.reviewsDone, 0);
          break;
        case 'reviewLogs':
          ok = day(r.day) && date(r.ts) && str(r.conceptId) && one(r.format, fmt) && int(r.rating, 1, 4) && num(r.elapsedMs) && (r.relearning===undefined||typeof r.relearning==='boolean');
          break;
        case 'practice':
          ok = Array.isArray(r.status) && r.status.every(bool) && str(r.notes);
          break;
        case 'projects':
          ok = strings(r.done) && str(r.repoUrl) && str(r.notes);
          break;
        case 'interviewAnswers':
          ok = date(r.ts) && str(r.questionId) && str(r.text) && num(r.coverage, 0, 1);
          break;
      }
      return ok ? r : fail();
    });
  }
  return {
    ...raw,
    data
  } as unknown as Snapshot;
}
