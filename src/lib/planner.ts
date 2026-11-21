import type { Catalog, Lesson } from '../content/types';
import type { Budget, Choice, DayPlan, Focus, Progress, Settings } from './model';
import { shiftDay } from './clock';
import {catalogIndex,inPathOrder} from '../content/catalog';
import { moduleOrder } from './curriculum';
export const finished = (p: Progress[]) => new Set(p.filter(x => x.status !== 'started').map(x => x.lessonId));
export function moduleDone(id: string, cat: Catalog, done: Set<string>) {
  const ls = cat.lessons.filter(l => l.module === id);
  return ls.length > 0 && ls.every(l => l.status==='ready' && done.has(l.id));
}
// Prerequisite credit and full curriculum completion deliberately use different denominators.
export function moduleSatisfied(id:string,cat:Catalog,done:Set<string>){
  const rows=catalogIndex(cat).rows.get(id) ?? [];
  return rows.some(({lesson})=>lesson.status==='ready') &&
    rows.every(({lesson})=>lesson.status!=='ready' || done.has(lesson.id));
}
export function blockers(l: Lesson, cat: Catalog, done: Set<string>) {
  const missing = [...(catalogIndex(cat).moduleById.get(l.module)?.prereqs ?? []).filter(id => !moduleSatisfied(id, cat, done)), ...l.prereqs.filter(id => !done.has(id))];
  return missing.length>1 ? inPathOrder(cat,missing) : missing;
}
export function available(cat: Catalog, done: Set<string>, focus: Focus, ratio: Settings['ratio']) {
  const mods = moduleOrder(cat, focus), index = catalogIndex(cat);
  const needed = new Set<string>();
  function need(id: string) {
    if (needed.has(id)) return;
    needed.add(id);
    index.moduleById.get(id)?.prereqs.forEach(need);
    for (const {lesson} of index.rows.get(id) ?? []) for (const p of lesson.prereqs) {
      const owner = index.lessons.get(p);
      if (owner) need(owner.module);
    }
  }
  const focused = focus === 'fullstack' || focus === 'aiinfra';
  if (focused) for (const m of mods) if (m.track === focus || m.track === 'foundations') need(m.id);
  const ls: Lesson[] = [];
  for (const m of mods) {
    if ((focused && !needed.has(m.id)) || m.prereqs.some(id=>!moduleSatisfied(id,cat,done))) continue;
    for (const {lesson:l} of index.rows.get(m.id) ?? []) {
      if (l.status === 'ready' && !done.has(l.id) && l.prereqs.every(id=>done.has(id))) ls.push(l);
    }
  }
  if (focus !== 'dual') return ls;
  const track = (l: Lesson) => index.moduleById.get(l.module)?.track;
  const a = ls.filter(l => track(l) === 'fullstack'),
    b = ls.filter(l => track(l) === 'aiinfra');
  const pattern = ratio === '2:1' ? [a, a, b] : ratio === '1:2' ? [a, b, b] : [a, b];
  let i = cat.lessons.filter(l => done.has(l.id) && ['fullstack', 'aiinfra'].includes(track(l) ?? '')).length;
  const out = ls.filter(l => track(l) === 'foundations');
  while (a.length || b.length) {
    const q = pattern[i++ % pattern.length];
    const next = q.shift();
    if (next) out.push(next);
  }
  return [...out, ...ls.filter(l => track(l) === 'career')];
}
// Planning credit is local to a position in today's list, never learner progress.
export function plannedBefore(done: Set<string>, items: string[], position = items.length) {
  return new Set([...done, ...items.slice(0, position)]);
}

export function planCandidates(cat: Catalog, done: Set<string>, plan: Pick<DayPlan,'items'|'focus'>,
  ratio: Settings['ratio'], position = plan.items.length) {
  if (position < 0 || position > plan.items.length) return [];
  const reserved = new Set(plan.items);
  // Manual picks span every track. Retain the dual-track rhythm for a dual plan.
  return available(cat, plannedBefore(done, plan.items, position), plan.focus==='dual'?'dual':'recommended', ratio)
    .filter(l=>!reserved.has(l.id));
}

export function planPrerequisites(l: Lesson, cat: Catalog, done: Set<string>, virtualDone: Set<string>) {
  const actual = blockers(l, cat, done);
  const missing = actual.length ? blockers(l, cat, virtualDone) : [];
  return {missing, scheduled: actual.filter(id=>!missing.includes(id))};
}

export function buildDayPlan(input: {
  catalog: Catalog;
  done: Set<string>;
  day: string;
  at: string;
  budget: Budget;
  focus: Focus;
  choice: Choice;
  ratio: Settings['ratio'];
  reviewIds: string[];
  reviewMinutes: number;
  forceOne?: boolean;
}): DayPlan {
  const {
    catalog,
    done,
    day,
    at,
    budget,
    focus,
    choice,
    ratio,
    reviewIds,
    reviewMinutes
  } = input;
  const items: string[] = [];
  let minutes = reviewMinutes;
  const virtualDone = new Set(done);
  while (budget.mode !== 'count' || items.length < budget.value) {
    const next = available(catalog, virtualDone, focus, ratio)[0];
    if (!next) break;
    if (budget.mode === 'time' && minutes + next.minutes > budget.value &&
        (items.length > 0 || (reviewMinutes > budget.value && !input.forceOne))) break;
    items.push(next.id);
    virtualDone.add(next.id);
    minutes += next.minutes;
  }
  return {
    day,
    budget,
    focus,
    ...choice,
    items,
    reviewIds,
    reviewDone: [],
    createdAt: at
  };
}
export const nextChoice = (plans: DayPlan[], day: string) => plans.find(p => p.day === shiftDay(day, -1) && p.nextReview?.day === day)?.nextReview;
export const preferenceFor = (plans: DayPlan[], s: Settings, day: string) => nextChoice(plans, day) ?? (s.nextReview?.day === day ? s.nextReview : undefined);
export function projection(cat: Catalog, done: Set<string>, budget: Budget, day: string) {
  const ls = cat.lessons.filter(l => l.status !== 'draft' && (l.status==='stub'||!done.has(l.id)));
  const days = Math.ceil(budget.mode === 'count' ? ls.length / budget.value : ls.reduce((n, l) => n + l.minutes, 0) / (budget.value * .7));
  return {
    days,
    end: shiftDay(day, Math.max(0, days - 1))
  };
}
