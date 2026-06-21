import type { WeaponState, LogEntry, CustomExercise, SportId, Bucket } from '@/domain/types';
import { SPORT_IDS, emptyBucket, emptySports } from '@/domain/types';
import { uid } from '@/domain/format';
import { getSupabaseServer } from './server';

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

function rowToLog(
  l: Record<string, unknown>,
  date: string,
  exName: string
): LogEntry {
  const metric = (l.metric as LogEntry['metric']) ?? 'weight';
  const entry: LogEntry = {
    id: l.id as string,
    date,
    ex: exName,
    sets: (l.sets as number) ?? 1,
    metric,
    set_type: l.set_type as LogEntry['set_type'],
    rpe: l.rpe as number | undefined,
    note: l.note as string | undefined,
    v1: l.v1 as number | undefined,
    v2: l.v2 as number | undefined,
    u1: l.u1 as string | undefined,
    u2: l.u2 as string | undefined,
  };
  if (metric === 'weight') {
    entry.kg = (l.kg as number) ?? (l.v1 as number) ?? 0;
    entry.reps = (l.reps as number) ?? 0;
  }
  return entry;
}

function migrateSettings(settings: Record<string, unknown>): Partial<WeaponState> {
  const out: Partial<WeaponState> = { ...settings } as Partial<WeaponState>;
  if (settings.mode === 'endurance' && !settings.sport) out.sport = 'run';
  if (settings.mode === 'strength' && !settings.sport) out.sport = 'gym';
  if (settings.sport) out.sport = settings.sport as SportId;

  if (settings.logo === 'weapon' || settings.logo === 'athlete') {
    out.logo = settings.logo;
  } else {
    delete out.logo;
  }

  const sports = emptySports();
  const legacySports = settings.sports as Record<string, Bucket> | undefined;
  if (legacySports) {
    for (const id of SPORT_IDS) {
      if (legacySports[id]) sports[id] = { ...emptyBucket(), ...legacySports[id], logs: [] };
    }
  }
  const strength = settings.strength as Bucket | undefined;
  const endurance = settings.endurance as Bucket | undefined;
  if (strength) {
    sports.gym = { ...sports.gym, ...strength, logs: sports.gym.logs };
  }
  if (endurance) {
    sports.run = { ...sports.run, ...endurance, logs: sports.run.logs };
  }
  out.sports = sports;

  if (settings.goals && typeof settings.goals === 'object') {
    // Accept legacy calories-only ({calTarget}) and the interim per-sport
    // ({gym:{target}}) shapes; normalise to calories-only.
    const g = settings.goals as { calTarget?: number; gym?: { target?: number } };
    const calTarget = g.calTarget ?? g.gym?.target;
    out.goals = calTarget != null ? { calTarget } : {};
  }

  return out;
}

export async function loadWeaponState(userId: string): Promise<WeaponState> {
  const sb = getSupabaseServer();

  const [userRes, exRes, workoutsRes] = await Promise.all([
    sb.from('app_users').select('bodyweight_kg, settings, display_name, username').eq('id', userId).single(),
    sb
      .from('exercises')
      .select('id, name, muscle_group, description, default_kg, is_preset, owner_id, sport, metric, u1, u2')
      .or(`owner_id.eq.${userId},owner_id.is.null`),
    sb
      .from('workouts')
      .select(
        'id, date, sport, workout_logs(id, exercise_id, kg, reps, sets, metric, v1, v2, u1, u2, set_type, note, rpe, ex_name, exercises(name))'
      )
      .eq('user_id', userId)
      .order('date', { ascending: false }),
  ]);

  if (userRes.error) throw userRes.error;

  const rawSettings = (userRes.data?.settings as Record<string, unknown>) ?? {};
  const migrated = migrateSettings(rawSettings);
  const sports = migrated.sports ?? emptySports();

  const exercises = exRes.data ?? [];
  const exMap = new Map(exercises.map((e) => [e.id, e]));

  for (const sport of SPORT_IDS) {
    sports[sport].custom = exercises
      .filter((e) => e.owner_id === userId && !e.is_preset && (e.sport === sport || (!e.sport && sport === 'gym')))
      .map((e) => ({
        n: e.name,
        g: e.muscle_group,
        t: e.description ?? '',
        start: e.default_kg ?? 0,
        m: e.metric as CustomExercise['m'],
        u1: e.u1,
        u2: e.u2,
      }));
  }

  for (const w of workoutsRes.data ?? []) {
    const sport = ((w.sport as SportId) || 'gym') as SportId;
    if (!sports[sport]) continue;
    const wlogs = (w as { workout_logs: Array<Record<string, unknown>> }).workout_logs ?? [];
    for (const l of wlogs) {
      const exJoin = l.exercises as { name: string } | null;
      const exName = (l.ex_name as string) || exJoin?.name || exMap.get(l.exercise_id as string)?.name;
      if (!exName) continue;
      sports[sport].logs.push(rowToLog(l, w.date as string, exName));
    }
  }

  const displayName =
    (migrated.profile?.name as string | undefined) ||
    userRes.data?.display_name ||
    userRes.data?.username ||
    '';

  return {
    ...DEFAULT_STATE,
    ...migrated,
    bw: userRes.data?.bodyweight_kg ?? 75,
    sports,
    profile: { ...migrated.profile, name: displayName },
  };
}

export function settingsPayload(state: WeaponState): Record<string, unknown> {
  const sportBuckets: Record<string, Pick<Bucket, 'removed' | 'order' | 'seenLevel'>> = {};
  for (const id of SPORT_IDS) {
    const b = state.sports[id];
    sportBuckets[id] = { removed: b.removed, order: b.order, seenLevel: b.seenLevel };
  }
  return {
    sport: state.sport,
    sports: sportBuckets,
    profile: state.profile,
    goals: state.goals,
    theme: state.theme,
    logo: state.logo,
    dev: state.dev,
    unit: state.unit,
    layout: state.layout,
    restDefault: state.restDefault,
    setsPerEntry: state.setsPerEntry,
    bar: state.bar,
    fab: state.fab,
  };
}

export async function saveWeaponSettings(userId: string, state: WeaponState): Promise<void> {
  const sb = getSupabaseServer();
  const { error } = await sb
    .from('app_users')
    .update({ settings: settingsPayload(state), bodyweight_kg: state.bw })
    .eq('id', userId);
  if (error) throw error;
}

async function resolveExerciseId(userId: string, exName: string, sport: SportId): Promise<string | null> {
  const sb = getSupabaseServer();
  const { data } = await sb
    .from('exercises')
    .select('id')
    .or(`owner_id.eq.${userId},owner_id.is.null`)
    .ilike('name', exName)
    .limit(1)
    .maybeSingle();
  if (data) return data.id;

  const { data: created, error } = await sb
    .from('exercises')
    .insert({
      owner_id: userId,
      name: exName,
      muscle_group: 'Other',
      is_preset: false,
      sport,
    })
    .select('id')
    .single();

  if (error) {
    // Unique name collision — fetch existing row
    if (error.code === '23505') {
      const { data: again } = await sb
        .from('exercises')
        .select('id')
        .or(`owner_id.eq.${userId},owner_id.is.null`)
        .ilike('name', exName)
        .limit(1)
        .maybeSingle();
      if (again) return again.id;
    }
    throw error;
  }
  return created!.id;
}

async function getOrCreateWorkoutId(userId: string, date: string, sport: SportId): Promise<string> {
  const sb = getSupabaseServer();
  const mode = sport === 'run' ? 'endurance' : 'strength';

  const { data: existing, error: findErr } = await sb
    .from('workouts')
    .select('id')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('sport', sport)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing) return existing.id;

  const { data: created, error: insErr } = await sb
    .from('workouts')
    .insert({ user_id: userId, date, sport, mode })
    .select('id')
    .single();

  if (insErr) {
    if (insErr.code === '23505') {
      const { data: again, error: againErr } = await sb
        .from('workouts')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .eq('sport', sport)
        .maybeSingle();
      if (againErr) throw againErr;
      if (again) return again.id;
    }
    throw insErr;
  }
  return created!.id;
}

export async function addWeaponLog(userId: string, sport: SportId, log: LogEntry): Promise<void> {
  const sb = getSupabaseServer();
  const metric = log.metric ?? 'weight';
  const exerciseId = await resolveExerciseId(userId, log.ex, sport);
  const workoutId = await getOrCreateWorkoutId(userId, log.date, sport);

  const logId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(log.id)
    ? log.id
    : uid();

  const row: Record<string, unknown> = {
    id: logId,
    workout_id: workoutId,
    user_id: userId,
    exercise_id: exerciseId,
    ex_name: log.ex,
    sets: log.sets ?? 1,
    metric,
    v1: log.v1 ?? log.kg ?? null,
    v2: log.v2 ?? null,
    u1: log.u1 ?? null,
    u2: log.u2 ?? null,
    set_type: log.set_type ?? null,
    note: log.note ?? null,
    rpe: log.rpe ?? null,
  };

  if (metric === 'weight') {
    row.kg = log.kg ?? log.v1 ?? null;
    row.reps = log.reps ?? null;
  }

  const { error: lErr } = await sb.from('workout_logs').insert(row);
  if (lErr) throw lErr;
}

export async function deleteWeaponLog(userId: string, logId: string): Promise<void> {
  const sb = getSupabaseServer();
  const { error } = await sb.from('workout_logs').delete().eq('id', logId).eq('user_id', userId);
  if (error) throw error;
}

export async function addCustomExercise(userId: string, sport: SportId, ex: CustomExercise): Promise<void> {
  const sb = getSupabaseServer();
  const { error } = await sb.from('exercises').insert({
    owner_id: userId,
    name: ex.n,
    muscle_group: ex.g,
    description: ex.t,
    default_kg: ex.start,
    is_preset: false,
    sport,
    metric: ex.m ?? 'weight',
    u1: ex.u1,
    u2: ex.u2,
  });
  if (error) throw error;
}

export async function listUsers() {
  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from('app_users')
    .select('id, username, display_name')
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    username: r.username,
    display_name: r.display_name,
  }));
}

export async function createUser(username: string) {
  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from('app_users')
    .insert({ username, display_name: username })
    .select('id, username, display_name')
    .single();
  if (error) throw error;
  return { id: data.id, username: data.username, display_name: data.display_name };
}

export async function uploadProfileMedia(
  userId: string,
  kind: 'photo' | 'cover',
  file: Buffer,
  contentType: string
): Promise<string> {
  const sb = getSupabaseServer();
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${kind}.${ext}`;
  const { error: upErr } = await sb.storage.from('profiles').upload(path, file, {
    contentType,
    upsert: true,
  });
  if (upErr) throw upErr;
  const { data } = sb.storage.from('profiles').getPublicUrl(path);
  return data.publicUrl;
}
