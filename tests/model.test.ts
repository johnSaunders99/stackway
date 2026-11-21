import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { inspect } from '../tools/content.mjs';
import type { Catalog, Concept } from '../src/content/types';
import { advanceDays, now, studyDay, setNow, shiftDay } from '../src/lib/clock';
import { available, blockers, buildDayPlan, planCandidates, plannedBefore, planPrerequisites, moduleDone, nextChoice, projection } from '../src/lib/planner';
import { schedule, newCard, flashRating, quizRating, taskRating, interviewRating, pickFormat, shuffled, queue, present, estimate } from '../src/lib/scheduler';
import { defaults, type Budget, type Choice, type StoredCard } from '../src/lib/model';
import { streaks, accuracy, forecast } from '../src/lib/metrics';
const r = inspect('fixtures/content'),
  cat: Catalog = {
    ...r.index,
    concepts: r.deck.concepts,
    questions: []
  },
  ds = cat.lessons.filter(l => l.module === 'fd-demo').map(l => l.id),
  done = new Set(ds),
  day = '2026-11-20',
  at = new Date(day + 'T12:00:00'),
  choice: Choice = {
    format: 'flashcard',
    scope: 'due',
    tracks: defaults.tracks
  },
  input = {
    catalog: cat,
    done: new Set<string>(),
    day,
    at: at.toISOString(),
    budget: {
      mode: 'time',
      value: 60
    } as Budget,
    focus: 'recommended' as const,
    choice,
    ratio: '1:1' as const,
    reviewMinutes: 0,
    reviewIds: ['r']
  };
afterEach(() => setNow(null));
describe('study-day clock', () => {
  it.each([['03:59:59', '2026-11-19'], ['04:00:00', day], ['23:59:59', day]])('maps %s to %s', (t, d) => expect(studyDay(new Date(day + 'T' + t), 4)).toBe(d));
  it('rolls over year boundary', () => expect(shiftDay('2027-01-01', -1)).toBe('2026-12-31'));
  it('honours a midnight start', () => expect(studyDay(new Date(day + 'T00:01:00'), 0)).toBe(day));
  it('advances the simulated calendar without changing the system clock', () => {
    setNow(at.toISOString());
    advanceDays(2);
    expect(studyDay(now(), 4)).toBe('2026-11-22');
    expect(() => setNow('bad')).toThrow();
  });
  it('uses calendar dates around real 23/25-hour New York days', () => {
    const code = ts.transpileModule(readFileSync('src/lib/clock.ts', 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext
      }
    }).outputText;
    const result = execFileSync(process.execPath, ['--input-type=module', '-e', code + ";console.log(['2026-03-08T03:58','2026-03-08T04:00','2026-11-01T03:59','2026-11-01T04:00'].map(t=>studyDay(new Date(t),4)).join(','))"], {
      env: {
        ...process.env,
        TZ: 'America/New_York'
      },
      encoding: 'utf8'
    });
    expect(result.trim()).toBe('2026-03-07,2026-03-08,2026-10-31,2026-11-01');
  });
});
describe('curriculum and daily budgets', () => {
  it('reserves time for reviews first', () => expect(buildDayPlan({
    ...input,
    reviewMinutes: 23
  }).items).toEqual(ds.slice(0, 1)));
  it('offers one lesson even if it slightly exceeds the remaining time', () => expect(buildDayPlan({
    ...input,
    budget: {
      mode: 'time',
      value: 15
    }
  }).items).toHaveLength(1));
  it('holds new work when review alone exceeds budget', () => expect(buildDayPlan({
    ...input,
    reviewMinutes: 61
  }).items).toEqual([]));
  it('can explicitly add one to a review-heavy day', () => expect(buildDayPlan({
    ...input,
    reviewMinutes: 61,
    forceOne: true
  }).items).toHaveLength(1));
  it('count mode retains every queued review', () => {
    const p = buildDayPlan({
      ...input,
      budget: {
        mode: 'count',
        value: 2
      },
      reviewMinutes: 200
    });
    expect(p.items).toEqual(ds.slice(0, 2));
    expect(p.reviewIds).toEqual(['r']);
  });
  it('chains newly unlocked lessons up to the time budget without changing real completion', () => {
    for (const focus of ['recommended','dual'] as const) {
      const progress=new Set<string>();
      const p=buildDayPlan({...input,focus,done:progress});
      expect(p.items).toEqual(ds.slice(0,2)); // 20 + 20 fits; the next 25 does not.
      expect(progress.size).toBe(0);
    }
  });
  it('crosses into a dependent module only after its ready prerequisites are in the plan', () => {
    const p=buildDayPlan({...input,budget:{mode:'time',value:115}});
    expect(p.items).toEqual([...ds,'fs-demo-01-headings','fs-demo-02-styles']);
    expect(p.reviewIds).toEqual(input.reviewIds);
  });
  it('keeps the minimum-one rule when reviews exactly fill the budget',()=>{
    expect(buildDayPlan({...input,reviewMinutes:60}).items).toEqual([ds[0]]);
  });
  it('uses the whole plan for append but only the earlier prefix for a replacement',()=>{
    const plan={items:[ds[0],'cr-demo-01-evidence'],focus:input.focus};
    const ids=(items:string[],at?:number,done=new Set<string>())=>planCandidates(cat,done,{...plan,items},'1:1',at).map(l=>l.id);
    expect(ids(plan.items)).toContain(ds[1]);
    expect(ids(plan.items)).not.toContain(ds[2]);
    expect(ids(plan.items,0)).not.toContain(ds[1]);
    expect(ids(plan.items,1)).toContain(ds[1]);
    const later=[...plan.items,ds[1]];
    expect(ids(later,1)).not.toContain(ds[1]); // already reserved in a later slot
    expect(ids(later,1)).not.toContain(ds[2]); // its prerequisite is too late
    expect(ids(later,1,new Set([ds[1]]))).toContain(ds[2]); // actually completed out of order
    expect(ids(ds)).toContain('fs-demo-01-headings');
    expect(ids(ds,2)).not.toContain('fs-demo-01-headings');
  });
  it('distinguishes an earlier planned prerequisite from a still-missing prerequisite',()=>{
    const lesson={...cat.lessons.find(l=>l.id===ds[2])!,prereqs:[ds[0],ds[1]]};
    const actual=new Set<string>(), before=plannedBefore(actual,ds,1);
    expect(planPrerequisites(lesson,cat,actual,before)).toEqual({scheduled:[ds[0]],missing:[ds[1]]});
    expect(blockers(lesson,cat,actual)).toEqual([ds[0],ds[1]]);
    const dependent=cat.lessons.find(l=>l.id==='fs-demo-01-headings')!;
    expect(planPrerequisites(dependent,cat,actual,plannedBefore(actual,ds))).toEqual({scheduled:['fd-demo'],missing:[]});
  });
  it('requires every lesson in the prerequisite module', () => {
    expect(moduleDone('fd-demo', cat, new Set(ds.slice(0, 2)))).toBe(false);
    expect(moduleDone('fd-demo', cat, done)).toBe(true);
  });
  it('respects explicit extra lesson prereqs', () => {
    const l = {
      ...cat.lessons[0],
      prereqs: ['missing']
    };
    expect(blockers(l, cat, done)).toContain('missing');
  });
  it.each(['fullstack', 'aiinfra'] as const)('focus %s offers shared foundations before specialisation', focus => {
    expect(available(cat, new Set(), focus, '1:1').map(l => l.id)).toEqual([ds[0]]);
    expect(available(cat, done, focus, '1:1').every(l => l.module === (focus === 'fullstack' ? 'fs-demo' : 'ai-demo'))).toBe(true);
  });
  it('keeps draft/stub content out of new work', () => {
    const c = {
      ...cat,
      lessons: cat.lessons.map(l => l.id === ds[0] ? {
        ...l,
        status: 'draft' as const
      } : l)
    };
    expect(available(c, new Set(), 'recommended', '1:1').every(l => l.status === 'ready')).toBe(true);
  });
  it('follows recommended module order', () => {
    const c = {
      ...cat,
      path: {
        recommended: ['cr-demo', 'fd-demo']
      }
    };
    expect(available(c, new Set(), 'recommended', '1:1')[0].module).toBe('cr-demo');
  });
  it.each([['1:1', 'fs-demo,ai-demo'], ['2:1', 'fs-demo,fs-demo,ai-demo'], ['1:2', 'fs-demo,ai-demo,ai-demo']] as const)('alternates dual routes %s', (ratio, expected) => {
    const c = {
      ...cat,
      lessons: cat.lessons.map(l => ({
        ...l,
        status: 'ready' as const
      }))
    };
    const count=expected.split(',').length;
    const plan=buildDayPlan({...input,catalog:c,done,ratio,focus:'dual',budget:{mode:'count',value:count}});
    expect(plan.items.map(id=>c.lessons.find(l=>l.id===id)!.module).join(',')).toBe(expected);
    if(ratio==='2:1') expect(plan.items.slice(0,2)).toEqual(['fs-demo-01-headings','fs-demo-02-styles']);
  });
  it('applies a tomorrow choice only to its named next day', () => {
    const p = {
      ...buildDayPlan(input),
      nextReview: {
        day: shiftDay(day, 1),
        ...choice,
        budget: {
          mode: 'count' as const,
          value: 4
        }
      }
    };
    expect(nextChoice([p], shiftDay(day, 1))).toEqual(p.nextReview);
    expect(nextChoice([p], day)).toBeUndefined();
    expect(nextChoice([p], shiftDay(day, 2))).toBeUndefined();
  });
  it('projection reserves 30 percent for review and includes stubs', () => expect(projection(cat, new Set(), {
    mode: 'time',
    value: 60
  }, day).days).toBe(Math.ceil(cat.lessons.reduce((s, l) => s + l.minutes, 0) / 42)));
});
const cards: StoredCard[] = cat.concepts.slice(0, 5).map((c, i) => {
  const x = newCard(c, i === 1 ? shiftDay(day, -1) : day, at, 3, .9);
  return {
    ...x,
    trackId: i === 0 ? 'career' : 'foundations',
    card: {
      ...x.card,
      due: new Date(+at + (i === 4 ? 1 : -1) * 3600000),
      lapses: i === 4 ? 2 : 0,
      stability: i + 1
    }
  };
});
describe('memory queue and ratings', () => {
  it('orders and caps due cards; returns remaining due count', () => {
    const q = queue(cards, choice, at, {
      ...defaults,
      cap: 2
    });
    expect(q.ids).toHaveLength(2);
    expect(q.carry).toBe(2);
  });
  it('subtracts already rated items from daily capacity', () => expect(queue(cards, choice, at, {
    ...defaults,
    cap: 2
  }, false, 2)).toMatchObject({
    ids: [],
    carry: 4
  }));
  it('yesterday uses the study day of first learning', () => expect(queue(cards, {
    ...choice,
    scope: 'yesterday'
  }, at, defaults).ids).toEqual([cards[1].conceptId]));
  it('track scope filters before capping', () => expect(queue(cards, {
    ...choice,
    scope: 'tracks',
    tracks: ['career']
  }, at, defaults).ids).toEqual([cards[0].conceptId]));
  it('weakest first includes a not-yet-due lapsed card, then lower stability', () => expect(queue(cards, {
    ...choice,
    scope: 'weak'
  }, at, defaults).ids.slice(0, 2)).toEqual([cards[4].conceptId, cards[0].conceptId]));
  it('ahead includes future cards, never suspended ones', () => {
    expect(queue(cards, choice, at, defaults, true).ids).toHaveLength(5);
    expect(queue(cards.map(c => ({
      ...c,
      suspended: true
    })), choice, at, defaults, true).ids).toEqual([]);
  });
  it('maps each manual choice unchanged', () => expect(([1, 2, 3, 4] as const).map(flashRating)).toEqual([1, 2, 3, 4]));
  it.each([[true, false, 3], [true, true, 2], [false, false, 1]] as const)('quiz correct=%s guessed=%s → %s', (ok, g, want) => expect(quizRating(ok, g)).toBe(want));
  it.each([[1, 3], [.8, 3], [.79, 2], [.5, 2], [.49, 1], [0, 1]])('interview coverage %s → %s', (ratio, rating) => expect(interviewRating(ratio)).toBe(rating));
  it('hands-on maps four outcomes including skip', () => expect((['done', 'partial', 'failed', 'skip'] as const).map(taskRating)).toEqual([3, 2, 1, null]));
  it('mixed is reproducible for a study day and honours a sole nonzero weight', () => {
    const c = cat.concepts.find(c => c.interview)!;
    expect(pickFormat('mixed', c, day, defaults.weights)).toBe(pickFormat('mixed', c, day, defaults.weights));
    expect(pickFormat('mixed', c, day, [0, 0, 1])).toBe('interview');
  });
  it('falls back to flashcard if selected format is absent', () => {
    const c = {
      ...cat.concepts[0],
      mcq: undefined,
      interview: undefined
    };
    for (const f of ['quiz', 'interview', 'mixed'] as const) expect(pickFormat(f, c, day, [0, 1, 1])).toBe('flashcard');
  });
  it('MCQ permutation retains every option and is repeatable', () => {
    const a = [0, 1, 2, 3];
    expect(shuffled(a, day)).toEqual(shuffled(a, day));
    expect(shuffled(a, day).sort()).toEqual(a);
  });
  it('groups hands-on by lesson and charges practice minutes once', () => {
    const l = cat.lessons.find(l => l.id === ds[0])!,
      qs = present(l.concepts, {
        ...choice,
        format: 'hands-on'
      }, cat, day, defaults.weights);
    expect(qs).toHaveLength(1);
    expect(qs[0].ids).toHaveLength(3);
    expect(estimate(qs)).toBe(l.practice[0].minutes);
  });
  it('uses FSRS retention and advances the original card without mutating it', () => {
    const old = cards[0].card,
      next = schedule(old, 3, new Date(+at + 86400000), .9);
    expect(next.reps).toBe(old.reps + 1);
    expect(+next.due).toBeGreaterThan(+at);
  });
  it('shows overdue cards in the first forecast bar', () => expect(forecast(cards, day, 4)[0].count).toBe(5));
  it('distinguishes longest streak from current streak and ignores future days', () => {
    const ds = [-8, -7, -6, -2, -1, 1].map(i => ({
      day: shiftDay(day, i),
      activeMinutes: 5,
      lessonsDone: 0,
      reviewsDone: 0
    }));
    expect(streaks(ds, day)).toEqual({
      longest: 3,
      current: 2
    });
  });
});
