import { createContext, useContext } from 'react';
import type { Catalog } from '../content/types';
import type { Data, Settings } from '../lib/model';
export interface Workspace {
  cat: Catalog;
  data: Data;
  s: Settings;
  day: string;
  done: Set<string>;
  notify: (s: string) => void;
}
export const Context = createContext<Workspace | null>(null);
export function useWork() {
  const x = useContext(Context);
  if (!x) throw Error('學習工作區尚未就緒');
  return x;
}
