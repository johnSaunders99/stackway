import {catalogIndex} from '../content/catalog';
import type { Catalog } from '../content/types';
import type { Focus } from './model';
export function moduleOrder(cat: Catalog, focus: Focus) {
  const sorted = catalogIndex(cat).ordered;
  if (cat.path.recommended?.length || focus !== 'recommended') return [...sorted];
  // Keep the three technical tracks in sequence. Insert each career module
  // after the last technical module at or below its stage.
  const route = sorted.filter(m => m.track !== 'career');
  for (const m of sorted.filter(m => m.track === 'career')) {
    let i = route.length;
    while (i && route[i - 1].stage > m.stage) i--;
    route.splice(i, 0, m);
  }
  return route;
}
