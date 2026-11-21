export type TrackId = 'foundations' | 'fullstack' | 'aiinfra' | 'career';
export interface Track {
  id: TrackId;
  title: string;
  short: string;
  color: string;
  summary: string;
}
export interface Module {
  subtitle?: string;
  id: string;
  title: string;
  track: TrackId;
  summary: string;
  stage: number;
  order: number;
  outcomes: string[];
  prereqs: string[];
  roles: string[];
  hours: number;
  project?: string;
}
export interface Resource {
  title: string;
  url: string;
  kind: string;
  lang: string;
  minutes: number;
  required: boolean;
  checked: string;
  note?: string;
}
export interface Practice {
  id: string;
  title: string;
  kind: string;
  minutes: number;
  steps: string[];
  checks: string[];
  solution?: string;
  solutionHtml?: string;
}
export interface Lesson {
  subtitle?: string;
  id: string;
  module: string;
  order: number;
  title: string;
  status: 'ready' | 'draft' | 'stub';
  minutes: number;
  level: number;
  objectives: string[];
  tags: string[];
  resources: Resource[];
  concepts: string[];
  practice: Practice[];
  prereqs: string[];
}
export interface Interview {
  question: string;
  points: string[];
  answer: string;
}
export interface Concept {
  id: string;
  prompt: string;
  answer: string;
  trackId: TrackId;
  lessonId: string;
  moduleId: string;
  tags: string[];
  mcq?: {
    question?: string;
    options: string[];
    answer: number;
    explain: string;
  };
  interview?: Interview;
}
export interface Question extends Interview {
  set?: {id:string; title:string};
  id: string;
  track: TrackId;
  module?: string;
  tags: string[];
  conceptId?: string;
}
export interface Project {
  id: string;
  title: string;
  track: TrackId;
  summary: string;
  why: string;
  modules: string[];
  level: number;
  hours: number;
  milestones: {
    id: string;
    title: string;
    checks: string[];
  }[];
  stretch?: string[];
  showcase: string;
}
export interface Catalog {
  version: string;
  tracks: Track[];
  modules: Module[];
  lessons: Lesson[];
  projects: Project[];
  roles: {
    id: string;
    title: string;
    summary: string;
    skills: {
      id: string;
      title: string;
      weight: number;
      modules: string[];
    }[];
  }[];
  path: {
    recommended?: string[];
  };
  counts: Record<string, number>;
  concepts: Concept[];
  questions: Question[];
}
export interface Body {
  id: string;
  html: string;
  outline: {
    id: string;
    text: string;
    level: number;
  }[];
}
