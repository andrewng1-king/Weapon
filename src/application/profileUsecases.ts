import type { WeaponState, Profile, SportId } from '@/domain/types';

export async function saveProfile(
  repo: { saveSettings: (userId: string, state: WeaponState) => Promise<void> },
  userId: string,
  state: WeaponState,
  profile: Partial<Profile>
): Promise<WeaponState> {
  const updated: WeaponState = { ...state, profile: { ...state.profile, ...profile } };
  await repo.saveSettings(userId, updated);
  return updated;
}

export function setSport(state: WeaponState, sport: SportId): WeaponState {
  return { ...state, sport };
}

export function setTheme(state: WeaponState, theme: 'light' | 'dark'): WeaponState {
  return { ...state, theme };
}

export function setUnit(state: WeaponState, unit: 'kg' | 'lb'): WeaponState {
  return { ...state, unit };
}

export function setLayout(state: WeaponState, layout: 'comfortable' | 'dense'): WeaponState {
  return { ...state, layout };
}

export function setRestDefault(state: WeaponState, sec: number): WeaponState {
  return { ...state, restDefault: sec };
}

export function setSetsPerEntry(state: WeaponState, n: number): WeaponState {
  return { ...state, setsPerEntry: Math.max(1, Math.min(9, n)) };
}

export function setBarWeight(state: WeaponState, kg: number): WeaponState {
  return { ...state, bar: kg };
}

export function toggleLogo(state: WeaponState): WeaponState {
  return { ...state, logo: state.logo === 'weapon' ? 'athlete' : 'weapon' };
}

export function setDevMode(state: WeaponState, on: boolean, lvl?: number): WeaponState {
  return { ...state, dev: { ...state.dev, on, lvl: lvl ?? state.dev.lvl } };
}

export function setAccent(state: WeaponState, colorIndex: number): WeaponState {
  return { ...state, dev: { ...state.dev, color: colorIndex } };
}

export function setCalTarget(state: WeaponState, target: number): WeaponState {
  return {
    ...state,
    goals: { ...state.goals, calTarget: target },
  };
}

export function setFab(state: WeaponState, fab: WeaponState['fab']): WeaponState {
  return { ...state, fab };
}

export function markSeenLevel(state: WeaponState, lvl: number): WeaponState {
  const bucket = state.sports[state.sport];
  return {
    ...state,
    sports: {
      ...state.sports,
      [state.sport]: { ...bucket, seenLevel: lvl },
    },
  };
}
