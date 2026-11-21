import { now, studyDay, wall } from '../lib/clock';
import { trackMinutes } from './index';
export function activity(hour: () => number) {
  let lastInput = -Infinity,
    last = wall(),
    visible = !document.hidden;
  function flush() {
    const t = wall(),
      end = Math.min(t, lastInput + 120000);
    if (visible && end > last) {
      const at = now(),
        start = new Date(+at - (t - last)),
        stop = new Date(+at - (t - end)),
        d = studyDay(start, hour()),
        e = studyDay(stop, hour());
      if (d === e) void trackMinutes(d, (end - last) / 60000);else {
        const boundary = new Date(e + 'T00:00:00');
        boundary.setHours(hour());
        if (+boundary > +start) void trackMinutes(d, (+boundary - +start) / 60000);
        if (+stop > +boundary) void trackMinutes(e, (+stop - +boundary) / 60000);
      }
    }
    last = t;
  }
  function input() {
    if (!visible) return;
    const t = wall();
    if (t - lastInput > 120000) flush();
    lastInput = t;
  }
  function change() {
    flush();
    visible = !document.hidden;
    if (visible) last = wall();
  }
  const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'];
  events.forEach(k => window.addEventListener(k, input, {
    passive: true
  }));
  document.addEventListener('visibilitychange', change);
  const timer = setInterval(flush, 15000);
  return () => {
    clearInterval(timer);
    events.forEach(k => window.removeEventListener(k, input));
    document.removeEventListener('visibilitychange', change);
  };
}
