export * from './types';
import type { Group, PresetExercise, Bucket, CustomExercise } from './types';
export * from './sports';
export * from './accents';
export * from './ranks';
export * from './metrics';
export * from './format';

export const PRESETS: Record<Group, PresetExercise[]> = {
  Chest: [
    { n: 'Bench Press', t: 'Mid chest · front delts · triceps', start: 40 },
    { n: 'Incline Press', t: 'Upper chest · front delts', start: 30 },
    { n: 'Decline Press', t: 'Lower chest', start: 30 },
    { n: 'Dumbbell Press', t: 'Mid chest — free range', start: 20 },
    { n: 'Incline Dumbbell Press', t: 'Upper chest — free range', start: 16 },
    { n: 'Dip', t: 'Lower chest · triceps', start: 0 },
    { n: 'Cable Fly', t: 'Inner & mid chest', start: 12.5 },
    { n: 'Incline Cable Fly', t: 'Upper chest stretch', start: 10 },
    { n: 'Pec Deck', t: 'Inner chest — isolation', start: 25 },
    { n: 'Push-up', t: 'Chest · core — bodyweight', start: 0 },
  ],
  Back: [
    { n: 'Pull-up', t: 'Lats · upper back', start: 0 },
    { n: 'Chin-up', t: 'Lats · biceps', start: 0 },
    { n: 'Lat Pulldown', t: 'Lats — back width', start: 40 },
    { n: 'Close-grip Pulldown', t: 'Lower lats', start: 40 },
    { n: 'Barbell Row', t: 'Mid back · lats — thickness', start: 40 },
    { n: 'Pendlay Row', t: 'Explosive mid back', start: 40 },
    { n: 'Dumbbell Row', t: 'Lats — unilateral', start: 22 },
    { n: 'Seated Cable Row', t: 'Mid back · rhomboids', start: 40 },
    { n: 'T-Bar Row', t: 'Mid back thickness', start: 30 },
    { n: 'Deadlift', t: 'Lower back · glutes · hamstrings', start: 60 },
    { n: 'Straight-arm Pulldown', t: 'Lats — isolation', start: 20 },
  ],
  Shoulders: [
    { n: 'Overhead Press', t: 'Front & side delts · triceps', start: 30 },
    { n: 'Seated Dumbbell Press', t: 'Front & side delts', start: 16 },
    { n: 'Arnold Press', t: 'All three delt heads', start: 12 },
    { n: 'Lateral Raise', t: 'Side delts — width', start: 8 },
    { n: 'Cable Lateral Raise', t: 'Side delts — constant tension', start: 7 },
    { n: 'Rear Delt Fly', t: 'Rear delts · upper back', start: 8 },
    { n: 'Face Pull', t: 'Rear delts · traps — posture', start: 15 },
    { n: 'Front Raise', t: 'Front delts — isolation', start: 8 },
    { n: 'Upright Row', t: 'Side delts · traps', start: 25 },
    { n: 'Shrug', t: 'Upper traps', start: 40 },
  ],
  Arms: [
    { n: 'Barbell Curl', t: 'Biceps — overall mass', start: 20 },
    { n: 'Dumbbell Curl', t: 'Biceps — unilateral', start: 10 },
    { n: 'Hammer Curl', t: 'Biceps · brachialis', start: 10 },
    { n: 'Preacher Curl', t: 'Biceps — strict isolation', start: 15 },
    { n: 'Incline Dumbbell Curl', t: 'Biceps — long head stretch', start: 8 },
    { n: 'Cable Curl', t: 'Biceps — constant tension', start: 15 },
    { n: 'Concentration Curl', t: 'Biceps peak', start: 8 },
    { n: 'Tricep Pushdown', t: 'Triceps — lateral head', start: 20 },
    { n: 'Rope Pushdown', t: 'Triceps — all heads', start: 18 },
    { n: 'Skull Crusher', t: 'Triceps — long head', start: 20 },
    { n: 'Overhead Tricep Extension', t: 'Triceps — long head stretch', start: 15 },
    { n: 'Close-grip Bench Press', t: 'Triceps · chest', start: 35 },
    { n: 'Wrist Curl', t: 'Forearms — flexors', start: 10 },
  ],
  Legs: [
    { n: 'Squat', t: 'Quads · glutes', start: 50 },
    { n: 'Front Squat', t: 'Quads — upright', start: 40 },
    { n: 'Hack Squat', t: 'Quads — machine', start: 60 },
    { n: 'Leg Press', t: 'Quads · glutes', start: 80 },
    { n: 'Leg Extension', t: 'Quads — isolation', start: 30 },
    { n: 'Bulgarian Split Squat', t: 'Quads · glutes — unilateral', start: 16 },
    { n: 'Walking Lunge', t: 'Quads · glutes', start: 16 },
    { n: 'Romanian Deadlift', t: 'Hamstrings · glutes', start: 50 },
    { n: 'Leg Curl', t: 'Hamstrings — isolation', start: 30 },
    { n: 'Hip Thrust', t: 'Glutes', start: 60 },
    { n: 'Glute Kickback', t: 'Glutes — isolation', start: 15 },
    { n: 'Calf Raise', t: 'Calves', start: 40 },
    { n: 'Seated Calf Raise', t: 'Soleus — lower calf', start: 30 },
  ],
  Core: [
    { n: 'Cable Crunch', t: 'Abs — weighted', start: 25 },
    { n: 'Hanging Leg Raise', t: 'Lower abs · hip flexors', start: 0 },
    { n: 'Russian Twist', t: 'Obliques — rotation', start: 5 },
    { n: 'Plank', t: 'Whole core — reps = seconds', start: 0 },
    { n: 'Ab Wheel Rollout', t: 'Whole core — anti-extension', start: 0 },
    { n: 'Decline Sit-up', t: 'Upper abs — weighted', start: 5 },
    { n: 'Side Plank', t: 'Obliques — reps = seconds', start: 0 },
    { n: 'Mountain Climber', t: 'Core · cardio', start: 0 },
    { n: 'Leg Raise', t: 'Lower abs — floor', start: 0 },
  ],
};

export const GROUPS: Group[] = Object.keys(PRESETS) as Group[];

export const GROUP_COLORS: Record<Group, string> = {
  Chest: '#e8ff00',
  Back: '#9bbf8f',
  Shoulders: '#5b9bff',
  Arms: '#c08a6a',
  Legs: '#b06ae0',
  Core: '#cfc9cd',
};

export function exercisesFor(group: Group, bucket: Bucket): PresetExercise[] {
  if (!PRESETS[group]) return [];
  const list: PresetExercise[] = PRESETS[group]
    .filter((e) => !bucket.removed.includes(e.n))
    .concat(
      bucket.custom
        .filter((c: CustomExercise) => c.g === group)
        .map((c: CustomExercise) => ({ n: c.n, t: c.t, start: c.start, custom: true }))
    );
  const ord = bucket.order?.[group] || [];
  if (ord.length) {
    const ix = (n: string) => {
      const i = ord.indexOf(n);
      return i < 0 ? 9999 : i;
    };
    list.sort((a, b) => ix(a.n) - ix(b.n));
  }
  return list;
}

export function groupOf(exName: string): Group | null {
  for (const g of GROUPS) {
    if (PRESETS[g].some((e) => e.n === exName)) return g;
  }
  return null;
}

export function findEx(name: string): PresetExercise | undefined {
  for (const g of GROUPS) {
    const found = PRESETS[g].find((e) => e.n === name);
    if (found) return found;
  }
  return undefined;
}
