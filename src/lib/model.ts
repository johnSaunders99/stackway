import type { Card, Grade } from 'ts-fsrs';
import type { TrackId } from '../content/types';
export type Format = 'flashcard' | 'quiz' | 'interview' | 'hands-on' | 'mixed';
export type Scope = 'due' | 'yesterday' | 'tracks' | 'weak';
export type Focus = 'recommended' | 'dual' | 'fullstack' | 'aiinfra';
export interface Budget {
  mode: 'time' | 'count';
  value: number;
}
export interface Choice {
  format: Format;
  scope: Scope;
  tracks: TrackId[];
}
export interface Settings extends Choice {
  id: 'main';
  onboarded: boolean;
  budget: Budget;
  focus: Focus;
  ratio: '1:1' | '2:1' | '1:2';
  cap: number;
  weights: [number, number, number];
  retention: number;
  dayStartHour: number;
  quizSchedule: boolean;
  theme: 'light' | 'dark' | 'system';
  font: 'small' | 'medium' | 'large';
  width: 'narrow' | 'standard' | 'wide';
  reduceMotion: boolean;
  modifiedAt: string;
  nextReview?: Tomorrow;
}
export const defaults: Settings = {
  id: 'main',
  onboarded: false,
  budget: {
    mode: 'time',
    value: 60
  },
  focus: 'recommended',
  ratio: '1:1',
  cap: 60,
  format: 'mixed',
  scope: 'due',
  tracks: ['foundations', 'fullstack', 'aiinfra', 'career'],
  weights: [50, 30, 20],
  retention: .9,
  dayStartHour: 4,
  quizSchedule: true,
  theme: 'system',
  font: 'medium',
  width: 'standard',
  reduceMotion: false,
  modifiedAt: ''
};
export interface Progress {
  lessonId: string;
  status: 'started' | 'done' | 'skipped';
  startedAt: string;
  completedAt?: string;
  scrollY: number;
  quizResult: Record<string, boolean>;
}
export interface StoredCard {
  conceptId: string;
  lessonId: string;
  trackId: TrackId;
  firstLearnedDay: string;
  suspended: boolean;
  card: Card;
}
export interface Log {
  relearning?: boolean;
  id: string;
  conceptId: string;
  day: string;
  format: Format;
  rating: Grade;
  elapsedMs: number;
  ts: string;
}
export interface Tomorrow extends Choice {
  day: string;
  budget?: Budget;
}
export interface DayPlan extends Choice {
  day: string;
  budget: Budget;
  focus: Focus;
  items: string[];
  reviewIds: string[];
  reviewDone: string[];
  createdAt: string;
  closedAt?: string;
  nextReview?: Tomorrow;
}
export interface Stats {
  day: string;
  activeMinutes: number;
  lessonsDone: number;
  reviewsDone: number;
}
export interface TaskRecord {
  taskId: string;
  status: boolean[];
  notes: string;
}
export interface ProjectRecord {
  projectId: string;
  done: string[];
  repoUrl: string;
  notes: string;
}
export interface Answer {
  id: string;
  questionId: string;
  text: string;
  ts: string;
  coverage: number;
}
export interface Data {
  settings: Settings[];
  lessonProgress: Progress[];
  cards: StoredCard[];
  reviewLogs: Log[];
  dayPlans: DayPlan[];
  dayStats: Stats[];
  practice: TaskRecord[];
  projects: ProjectRecord[];
  interviewAnswers: Answer[];
}
export function emptyStats(day: string): Stats {
  return {
    day,
    activeMinutes: 0,
    lessonsDone: 0,
    reviewsDone: 0
  };
}
