export type SportId =
  | 'gym'
  | 'run'
  | 'calisthenics'
  | 'hyrox'
  | 'swimming'
  | 'boxing'
  | 'bodyweight'
  | 'trail'
  | 'trekking';

export const SPORT_IDS: SportId[] = [
  'gym',
  'run',
  'calisthenics',
  'hyrox',
  'swimming',
  'boxing',
  'bodyweight',
  'trail',
  'trekking',
];

export type MetricType = 'weight' | 'dist' | 'reps' | 'hold' | 'time' | 'rounds';
export type SetType = 'warm' | 'work' | 'drop';

export interface LogEntry {
  id: string;
  date: string;
  ex: string;
  sets: number;
  metric?: MetricType;
  /** Weight metric: kg (canonical). Other metrics: primary value. */
  kg?: number;
  reps?: number;
  v1?: number;
  v2?: number;
  u1?: string;
  u2?: string;
  set_type?: SetType;
  rpe?: number;
  note?: string;
}

export interface CustomExercise {
  n: string;
  g: string;
  t: string;
  start: number;
  m?: MetricType;
  u1?: string;
  u2?: string;
}

export interface PresetExercise {
  n: string;
  t: string;
  start: number;
  custom?: boolean;
  m?: MetricType;
  u1?: string;
  u2?: string;
}

export interface Profile {
  name?: string;
  job?: string;
  height?: number;
  bio?: string;
  spotify?: string;
  photo?: string;
  cover?: string;
  coverPos?: string;
}

export interface DevSettings {
  on: boolean;
  lvl: number;
  color: number;
}

export interface Bucket {
  logs: LogEntry[];
  custom: CustomExercise[];
  removed: string[];
  order: Record<string, string[]>;
  seenLevel?: number;
}

export interface WeaponState {
  sport: SportId;
  sports: Record<SportId, Bucket>;
  bw: number;
  profile: Profile;
  /** Legacy calories-only weekly goal. */
  goals: { calTarget?: number };
  theme: 'light' | 'dark';
  logo: 'weapon' | 'athlete';
  dev: DevSettings;
  unit: 'kg' | 'lb';
  layout: 'comfortable' | 'dense';
  restDefault: number;
  setsPerEntry: number;
  bar: number;
  fab: { side: 'left' | 'right'; y: number };
}

export interface User {
  id: string;
  username: string;
  display_name?: string;
}

/** Gym muscle groups — other sports use string category names. */
export type Group = 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Core';

export interface AvatarStats {
  vol: number;
  maxSet: number;
  groupsHit: number;
  sessions: number;
  streak: number;
  lvl: number;
  logs: number;
}

export interface Achievement {
  nm: string;
  ic: string;
  got: boolean;
  p: number;
}

export interface LevelInfo {
  xp: number;
  lvl: number;
  into: number;
  need: number;
  pct: number;
}

export interface RankInfo {
  name: string;
  next: string | null;
  nextLvl: number;
}

export function emptyBucket(): Bucket {
  return { logs: [], custom: [], removed: [], order: {} };
}

export function emptySports(): Record<SportId, Bucket> {
  const out = {} as Record<SportId, Bucket>;
  for (const id of SPORT_IDS) out[id] = emptyBucket();
  return out;
}

export function activeBucket(state: WeaponState): Bucket {
  return state.sports[state.sport] ?? emptyBucket();
}

export const DEFAULT_USER_ID = 'b278b601-876d-475b-92eb-bf0b5a9f15a7';
