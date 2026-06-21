'use client';

import type { ReactNode } from 'react';
import { useWeapon, useUIStore } from '@/hooks';
import { weekDates, calForVals } from '@/domain/metrics';
import { todayStr, fmtK } from '@/domain/format';
import { Chart } from './Chart';
import { drawGauge } from '@/ui/lib/charts';

const DOWS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULT_CAL_TARGET = 3000;

type GoalIcon = 'flame' | 'cal' | 'weight' | 'foot';

function GoalStatIcon({ ico }: { ico: GoalIcon }) {
  const paths: Record<GoalIcon, ReactNode> = {
    flame: <path d="M12 3c1.2 3-2 4.2-2 7a4 4 0 0 0 8 0c0-1.3-.6-2.4-1.3-3.3.3 3.8-2.7 3.6-2.7 1.1C12 6.2 12 4.4 12 3z" />,
    cal: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>,
    weight: <><circle cx="12" cy="4.4" r="2" /><path d="M12 6.4v8M8.2 9.4h7.6M9.4 19l2.6-4.6L14.6 19" /></>,
    foot: <><path d="M9 11c-1.6 0-2.6 1.4-2.6 3.4S7.6 18 9.4 18s2.8-1.2 2.8-3.8C12.2 9.6 11 6 9 6 8 6 9 9 9 11z" /><circle cx="15.5" cy="7" r="1.3" /><circle cx="17.5" cy="9.5" r="1.1" /></>,
  };
  return (
    <div className="gs-ico">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {paths[ico]}
      </svg>
    </div>
  );
}

function GoalStat({ ico, v, l }: { ico: GoalIcon; v: ReactNode; l: string }) {
  return (
    <div className="goal-stat">
      <GoalStatIcon ico={ico} />
      <div className="gs-v">{v}</div>
      <div className="gs-l">{l}</div>
    </div>
  );
}

export function GoalsTab() {
  const { state, setCalTarget } = useWeapon();
  const sport = state.sport;
  const bucket = state.sports[sport];
  const setModal = useUIStore((s) => s.setModal);

  const wk = weekDates();
  const today = todayStr();

  const weekCal = bucket.logs
    .filter((l) => wk.includes(l.date))
    .reduce((a, l) => a + calForVals(l.kg ?? 0, l.reps ?? 0, l.sets || 3, state.bw), 0);
  const target = state.goals.calTarget ?? DEFAULT_CAL_TARGET;
  const pct = Math.max(0, Math.min(1, target ? weekCal / target : 0));
  const daysLifted = new Set(bucket.logs.map((l) => l.date)).size;

  function openCalendar() {
    setModal('calendar');
  }

  function onTargetChange(raw: string) {
    const x = parseInt(raw, 10);
    if (!isNaN(x) && x > 0) setCalTarget(x);
  }

  return (
    <main>
      <div className="sectionTitle">Daily goals</div>

      <div className="card" style={{ cursor: 'pointer' }} onClick={openCalendar}>
        <h2>This week</h2>
        <div className="hint">Days you trained · tap for calendar</div>
        <div className="goal-week">
          {wk.map((d, i) => {
            const trained = bucket.logs.some((l) => l.date === d);
            const isToday = d === today;
            return (
              <div
                key={d}
                className={`goal-day${trained ? ' trained' : ''}${isToday ? ' today' : ''}`}
                onClick={(e) => { e.stopPropagation(); openCalendar(); }}
              >
                <div className="gd-dow">{DOWS[i]}</div>
                <div className="gd-num">{+d.slice(8)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2>Goal progress</h2>
        <div className="hint">Calories burned this week</div>
        <div className="gauge-wrap">
          <Chart height={170} draw={(ctx, w, h) => drawGauge(ctx, w, h, pct)} deps={[pct]} />
          <div className="gauge-center">
            <div className="gauge-val">{fmtK(weekCal)}</div>
            <div className="gauge-lbl">of {fmtK(target)} kcal</div>
          </div>
        </div>
        <div className="goal-target">
          Weekly target
          <input type="number" value={target} onChange={(e) => onTargetChange(e.target.value)} />
          kcal
        </div>
      </div>

      <div className="goal-grid">
        <GoalStat ico="flame" v={fmtK(weekCal)} l="kcal this week" />
        <GoalStat ico="cal" v={daysLifted} l="days lifted" />
        <GoalStat ico="weight" v={`${state.bw || 75} kg`} l="bodyweight" />
        <GoalStat ico="foot" v="—" l="steps · soon" />
      </div>
    </main>
  );
}
