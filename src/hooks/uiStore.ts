import { create } from 'zustand';
import type { LogEntry } from '@/domain/types';

export type TabId = 'workout' | 'goals' | 'home' | 'report' | 'avatar';
export type Modal = 'addExercise' | 'settings' | 'ranks' | 'calendar' | 'planner' | 'recExercise' | 'recSummary' | null;

export interface ExerciseVals {
  kg?: number;
  reps?: number;
  v1?: number;
  v2?: number;
}

export interface PendingSet {
  set_type?: LogEntry['set_type'];
  rpe?: number;
  note?: string;
}

interface RecordingState {
  active: boolean;
  startTime: number;
  elapsed: number;
  logs: string[];
  minimized: boolean;
}

interface RestState {
  active: boolean;
  remaining: number;
  total: number;
}

interface UIState {
  tab: TabId;
  prevTab: TabId | null;
  tabAnimKey: number;
  category: string;
  searchOpen: boolean;
  searchQuery: string;
  menuOpen: boolean;
  modal: Modal;
  rankOpen: boolean;
  recording: RecordingState;
  vals: Record<string, ExerciseVals>;
  pending: Record<string, PendingSet>;
  rest: RestState;
  wkPage: 'workout' | 'history';

  setTab: (t: TabId) => void;
  setCategory: (c: string) => void;
  toggleSearch: () => void;
  setSearchQuery: (q: string) => void;
  setMenuOpen: (open: boolean) => void;
  setModal: (m: Modal) => void;
  setRankOpen: (open: boolean) => void;
  setVal: (ex: string, kg: number, reps: number) => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleMinimized: () => void;
  tickRecording: () => void;
  addRecordingLog: (name: string) => void;
  startRest: (seconds: number) => void;
  adjustRest: (delta: number) => void;
  skipRest: () => void;
  tickRest: () => void;
  setWkPage: (p: 'workout' | 'history') => void;
  clearVals: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  tab: 'workout',
  prevTab: null,
  tabAnimKey: 0,
  category: 'Chest',
  searchOpen: false,
  searchQuery: '',
  menuOpen: false,
  modal: null,
  rankOpen: false,
  recording: { active: false, startTime: 0, elapsed: 0, logs: [], minimized: false },
  vals: {},
  pending: {},
  rest: { active: false, remaining: 0, total: 0 },
  wkPage: 'workout',

  setTab: (t) =>
    set((s) =>
      s.tab === t
        ? s
        : { tab: t, prevTab: s.tab, tabAnimKey: s.tabAnimKey + 1 },
    ),
  setCategory: (c) => set({ category: c }),
  toggleSearch: () =>
    set((s) => ({ searchOpen: !s.searchOpen, searchQuery: s.searchOpen ? '' : s.searchQuery })),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setMenuOpen: (open) => set({ menuOpen: open }),
  setModal: (m) => set({ modal: m }),
  setRankOpen: (open) => set({ rankOpen: open }),
  setVal: (ex, kg, reps) => set((s) => ({ vals: { ...s.vals, [ex]: { kg, reps } } })),
  startRecording: () => set({ recording: { active: true, startTime: Date.now(), elapsed: 0, logs: [], minimized: false } }),
  stopRecording: () => set((s) => ({ recording: { ...s.recording, active: false } })),
  toggleMinimized: () => set((s) => ({ recording: { ...s.recording, minimized: !s.recording.minimized } })),
  tickRecording: () =>
    set((s) => ({
      recording: {
        ...s.recording,
        elapsed: s.recording.active
          ? Math.floor((Date.now() - s.recording.startTime) / 1000)
          : s.recording.elapsed,
      },
    })),
  addRecordingLog: (name) =>
    set((s) =>
      s.recording.active ? { recording: { ...s.recording, logs: [...s.recording.logs, name] } } : {}
    ),
  startRest: (seconds) => set({ rest: { active: true, remaining: seconds, total: seconds } }),
  adjustRest: (delta) =>
    set((s) => ({
      rest: { ...s.rest, remaining: Math.max(0, s.rest.remaining + delta) },
    })),
  skipRest: () => set({ rest: { active: false, remaining: 0, total: 0 } }),
  tickRest: () =>
    set((s) => {
      if (!s.rest.active) return {};
      const remaining = s.rest.remaining - 1;
      if (remaining <= 0) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(200);
        return { rest: { ...s.rest, active: false, remaining: 0 } };
      }
      return { rest: { ...s.rest, remaining } };
    }),
  setWkPage: (p) => set({ wkPage: p }),
  clearVals: () => set({ vals: {}, pending: {} }),
}));
