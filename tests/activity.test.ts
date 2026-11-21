import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { trackMinutes } from '../src/db';
import { activity } from '../src/db/activity';
vi.mock('../src/db', () => ({
  trackMinutes: vi.fn(async () => {})
}));
let doc: EventTarget & {
    hidden: boolean;
  }, win: EventTarget, dispose: () => void;
const total = () => vi.mocked(trackMinutes).mock.calls.reduce((n, [, mins]) => n + mins, 0);
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-20T03:59:50'));
  doc = Object.assign(new EventTarget(), {
    hidden: false
  });
  win = new EventTarget();
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', doc);
  vi.clearAllMocks();
  dispose = activity(() => 4);
});
afterEach(() => {
  dispose();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('does not count an unattended tab on opening', () => {
  vi.advanceTimersByTime(180000);
  expect(total()).toBe(0);
});
it('caps activity at two minutes after the last input', () => {
  win.dispatchEvent(new Event('keydown'));
  vi.advanceTimersByTime(300000);
  expect(total()).toBeCloseTo(2);
});
it('flushes partial time on hide and ignores time while hidden', () => {
  win.dispatchEvent(new Event('pointerdown'));
  vi.advanceTimersByTime(8000);
  doc.hidden = true;
  doc.dispatchEvent(new Event('visibilitychange'));
  vi.advanceTimersByTime(190000);
  expect(total()).toBeCloseTo(8 / 60);
});
it('allocates an interval spanning 04:00 to its two study days', () => {
  win.dispatchEvent(new Event('wheel'));
  vi.advanceTimersByTime(15000);
  expect(vi.mocked(trackMinutes).mock.calls).toEqual([['2026-11-19', 10 / 60], ['2026-11-20', 5 / 60]]);
});
