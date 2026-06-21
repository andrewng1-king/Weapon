'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { HttpWorkoutRepository } from '@/infrastructure/api/HttpWorkoutRepository';
import { useUserPicker } from './useUserPicker';
import type { WeaponState, LogEntry, CustomExercise, SportId } from '@/domain/types';
import { emptySports } from '@/domain/types';
import * as workoutUC from '@/application/workoutUsecases';
import * as profileUC from '@/application/profileUsecases';

const repo = new HttpWorkoutRepository();

const DEFAULT_STATE: WeaponState = {
  sport: 'gym',
  sports: emptySports(),
  bw: 75,
  profile: {},
  goals: {},
  theme: 'dark',
  logo: 'athlete',
  dev: { on: false, lvl: 1, color: 0 },
  unit: 'kg',
  layout: 'comfortable',
  restDefault: 120,
  setsPerEntry: 1,
  bar: 0,
  fab: { side: 'right', y: 0.5 },
};

export function useWeapon() {
  const { userId } = useUserPicker();
  const qc = useQueryClient();

  const { data: state, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.state(userId ?? '__none'),
    queryFn: () => repo.loadState(userId!),
    enabled: !!userId,
    retry: false,
  });

  const effectiveState = state ?? DEFAULT_STATE;

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.state(userId ?? '__none') });

  const logMutation = useMutation({
    mutationFn: async (log: LogEntry) => {
      if (!userId) throw new Error('No user');
      await workoutUC.logSet(repo, userId, effectiveState, log);
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (logId: string) => {
      if (!userId) throw new Error('No user');
      await workoutUC.deleteLog(repo, userId, logId);
    },
    onSuccess: invalidate,
  });

  const addCustomMutation = useMutation({
    mutationFn: async (ex: CustomExercise) => {
      if (!userId) throw new Error('No user');
      await workoutUC.addCustomExercise(repo, userId, effectiveState.sport, ex);
    },
    onSuccess: invalidate,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (updated: WeaponState) => {
      if (!userId) throw new Error('No user');
      await repo.saveSettings(userId, updated);
    },
    onSuccess: invalidate,
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async ({ kind, file }: { kind: 'photo' | 'cover'; file: File }) => {
      if (!userId) throw new Error('No user');
      return repo.uploadMedia!(userId, kind, file);
    },
  });

  function updateState(updater: (s: WeaponState) => WeaponState) {
    const updated = updater(effectiveState);
    qc.setQueryData(queryKeys.state(userId ?? '__none'), updated);
    if (userId) saveSettingsMutation.mutate(updated);
  }

  return {
    state: effectiveState,
    isLoading: !!userId && isLoading,
    isError,
    error,
    userId,
    logExercise: (log: LogEntry) => logMutation.mutate(log),
    deleteLog: (logId: string) => deleteMutation.mutate(logId),
    addCustomExercise: (ex: CustomExercise) => addCustomMutation.mutate(ex),
    uploadMedia: (kind: 'photo' | 'cover', file: File) => uploadMediaMutation.mutateAsync({ kind, file }),
    removeExercise: (name: string) => updateState((s) => workoutUC.removeExercise(s, name)),
    setOrder: (group: string, order: string[]) => updateState((s) => workoutUC.setOrder(s, group, order)),
    setSport: (sport: SportId) => updateState((s) => profileUC.setSport(s, sport)),
    setTheme: (theme: 'light' | 'dark') => updateState((s) => profileUC.setTheme(s, theme)),
    setUnit: (unit: 'kg' | 'lb') => updateState((s) => profileUC.setUnit(s, unit)),
    setLayout: (layout: 'comfortable' | 'dense') => updateState((s) => profileUC.setLayout(s, layout)),
    setRestDefault: (sec: number) => updateState((s) => profileUC.setRestDefault(s, sec)),
    setSetsPerEntry: (n: number) => updateState((s) => profileUC.setSetsPerEntry(s, n)),
    setBarWeight: (kg: number) => updateState((s) => profileUC.setBarWeight(s, kg)),
    toggleLogo: () => updateState((s) => profileUC.toggleLogo(s)),
    setDevMode: (on: boolean, lvl?: number) => updateState((s) => profileUC.setDevMode(s, on, lvl)),
    setAccent: (idx: number) => updateState((s) => profileUC.setAccent(s, idx)),
    saveProfile: (profile: Partial<WeaponState['profile']>) =>
      updateState((s) => ({ ...s, profile: { ...s.profile, ...profile } })),
    setCalTarget: (target: number) =>
      updateState((s) => profileUC.setCalTarget(s, target)),
    setFab: (fab: WeaponState['fab']) => updateState((s) => profileUC.setFab(s, fab)),
    markSeenLevel: (lvl: number) => updateState((s) => profileUC.markSeenLevel(s, lvl)),
    setBw: (bw: number) => updateState((s) => ({ ...s, bw })),
  };
}
