'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useWeapon, useUIStore } from '@/hooks';
import { categoriesFor, exercisesFor, exMetric } from '@/domain/sports';
import { todayStr, fmtDate, round1 } from '@/domain/format';
import { volume } from '@/domain/metrics';
import { lineChart } from '@/ui/lib/charts';
import { Chart } from './Chart';
import { showToast, showToastAction } from './Toast';
import { createLogEntry, isLoggedToday } from '@/application/workoutUsecases';
import type { PresetExercise, LogEntry } from '@/domain/types';

function prefersReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function haptic(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
}

const nf = (n: number) => Math.round(n).toLocaleString('en-US');

export function WorkoutTab() {
  const { state, logExercise, deleteLog, removeExercise } = useWeapon();
  const sport = state.sport;
  const bucket = state.sports[sport];
  const cats = categoriesFor(sport);
  const category = useUIStore((s) => s.category);
  const setCategory = useUIStore((s) => s.setCategory);
  const searchOpen = useUIStore((s) => s.searchOpen);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const toggleSearch = useUIStore((s) => s.toggleSearch);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const vals = useUIStore((s) => s.vals);
  const setVal = useUIStore((s) => s.setVal);
  const wkPage = useUIStore((s) => s.wkPage);
  const setWkPage = useUIStore((s) => s.setWkPage);
  const setModal = useUIStore((s) => s.setModal);
  const startRest = useUIStore((s) => s.startRest);

  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  const [animLogged, setAnimLogged] = useState<string | null>(null);
  const [prFlash, setPrFlash] = useState<string | null>(null);

  const today = todayStr();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const wt = (e.target as HTMLElement).closest('.wk-top');
      if (!wt) setGroupMenuOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    setOpenDetail(null);
  }, [category, searchQuery, sport]);

  // ---- exercises list (search across all groups, otherwise current group) ----
  const exercises: (PresetExercise & { group?: string })[] = [];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    cats.forEach((g) => {
      exercisesFor(sport, g, bucket).forEach((e) => {
        if (e.n.toLowerCase().includes(q) || e.t.toLowerCase().includes(q)) {
          exercises.push({ ...e, group: g });
        }
      });
    });
  } else {
    exercises.push(...exercisesFor(sport, category, bucket));
  }

  const total = exercises.length;
  const loggedCount = exercises.reduce((n, e) => (isLoggedToday(bucket, e.n) ? n + 1 : n), 0);

  // ---- per-exercise helpers (legacy parity) ----
  function logsForEx(name: string): LogEntry[] {
    return bucket.logs
      .filter((l) => l.ex === name)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }
  function lastLogFor(name: string): LogEntry | null {
    const l = logsForEx(name);
    return l.length ? l[l.length - 1] : null;
  }
  function prevLogFor(name: string): LogEntry | null {
    const l = logsForEx(name);
    return l.length > 1 ? l[l.length - 2] : null;
  }

  function valsOf(ex: PresetExercise): { kg: number; reps: number } {
    const v = vals[ex.n];
    if (v && (v.kg !== undefined || v.reps !== undefined)) {
      return { kg: v.kg ?? ex.start, reps: v.reps ?? 8 };
    }
    const last = lastLogFor(ex.n);
    if (last) return { kg: last.kg ?? ex.start, reps: last.reps ?? 8 };
    return { kg: ex.start, reps: 8 };
  }

  function bumpKg(ex: PresetExercise, delta: number) {
    const v = valsOf(ex);
    setVal(ex.n, Math.max(0, round1(v.kg + delta)), v.reps);
  }
  function bumpReps(ex: PresetExercise, delta: number) {
    const v = valsOf(ex);
    setVal(ex.n, v.kg, Math.max(0, v.reps + delta));
  }
  function setKgInput(ex: PresetExercise, raw: string) {
    const v = valsOf(ex);
    const x = parseFloat(raw);
    if (!isNaN(x) && x >= 0) setVal(ex.n, x, v.reps);
  }
  function setRepsInput(ex: PresetExercise, raw: string) {
    const v = valsOf(ex);
    const x = parseFloat(raw);
    if (!isNaN(x) && x >= 0) setVal(ex.n, v.kg, x);
  }

  function handleLogTap(ex: PresetExercise) {
    const already = isLoggedToday(bucket, ex.n);

    if (already) {
      haptic(18);
      const todayLog = bucket.logs.find((l) => l.ex === ex.n && l.date === today);
      if (todayLog) deleteLog(todayLog.id);
      showToast(`${ex.n} · log removed`);
      return;
    }

    const v = valsOf(ex);
    haptic([12, 28, 12]);

    // PR detection (working sets only; first-ever log is not a PR)
    const workingLogs = bucket.logs.filter((l) => l.ex === ex.n && (l.set_type ?? 'work') !== 'warm');
    const bestPrev = workingLogs.reduce((m, l) => Math.max(m, l.kg ?? 0), 0);
    const isPR = workingLogs.length > 0 && v.kg >= bestPrev;

    const log = createLogEntry(ex, v, sport, state.setsPerEntry || 3);
    logExercise(log);

    if (!prefersReduced()) {
      setAnimLogged(ex.n);
      window.setTimeout(() => setAnimLogged((cur) => (cur === ex.n ? null : cur)), 700);
      if (isPR) {
        setPrFlash(ex.n);
        window.setTimeout(() => setPrFlash((cur) => (cur === ex.n ? null : cur)), 900);
      }
    }

    const wlabel = `${v.kg} kg × ${v.reps}`;
    if (isPR) {
      showToast(`★ New PR · ${ex.n} · ${wlabel}`);
    } else {
      showToastAction(`Logged ${ex.n} · ${wlabel}`, 'Undo', () => deleteLog(log.id));
    }

    // Start rest timer for weight/reps metrics (skip dist/time per legacy logEx).
    const m = exMetric(ex, sport);
    if (m !== 'dist' && m !== 'time') startRest(state.restDefault);
  }

  function trendNode(ex: PresetExercise): ReactNode {
    const last = lastLogFor(ex.n);
    if (!last) return <span className="flat">Not logged yet</span>;
    const prev = prevLogFor(ex.n);
    let arrow: ReactNode = null;
    if (prev) {
      const lk = last.kg ?? 0;
      const pk = prev.kg ?? 0;
      if (lk > pk) arrow = <span className="up">▲ +{round1(lk - pk)}</span>;
      else if (lk < pk) arrow = <span className="down">▼ {round1(lk - pk)}</span>;
      else arrow = <span className="flat">—</span>;
    }
    const all = logsForEx(ex.n);
    const best = Math.max(...all.map((l) => l.kg ?? 0));
    const showStar = prev !== null && (last.kg ?? 0) >= best;
    return (
      <>
        Last <b>{last.kg} kg × {last.reps}</b>
        {arrow ? <> {arrow}</> : null}
        {showStar ? <> <span className="pr-star">★</span></> : null}
      </>
    );
  }

  // ---- history view data ----
  const sessionDates = [...new Set(bucket.logs.map((l) => l.date))].sort().reverse();

  return (
    <>
      <div className="wk-seg">
        <button type="button" className={wkPage === 'workout' ? 'on' : ''} onClick={() => setWkPage('workout')}>
          Workout
        </button>
        <button type="button" className={wkPage === 'history' ? 'on' : ''} onClick={() => setWkPage('history')}>
          History
        </button>
      </div>

      {wkPage === 'workout' ? (
        <>
          <div className="wk-head">
            <div className="wk-top">
              <button
                type="button"
                className={`group-dd${groupMenuOpen ? ' open' : ''}`}
                onClick={() => setGroupMenuOpen((o) => !o)}
              >
                <span>{category}</span>
                <svg className="dd-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {groupMenuOpen && (
                <div className="group-menu open">
                  {cats.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={g === category ? 'on' : ''}
                      onClick={() => {
                        setCategory(g);
                        setGroupMenuOpen(false);
                      }}
                    >
                      {g}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="dd-add"
                    onClick={() => {
                      setGroupMenuOpen(false);
                      setModal('addExercise');
                    }}
                  >
                    + New exercise
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className={`wk-search-btn${searchOpen ? ' on' : ''}`}
              onClick={toggleSearch}
              aria-label="Search exercises"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.2-4.2" />
              </svg>
            </button>
          </div>

          {searchOpen && (
            <div className="wk-searchbar open">
              <input
                type="search"
                placeholder="Search all exercises…"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <main>
            {searchQuery ? (
              <div className="eb" style={{ margin: '6px 2px 10px' }}>
                {total} result{total === 1 ? '' : 's'} for &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              <div className="eb" style={{ margin: '6px 2px 10px' }}>
                Today · {loggedCount} of {total} logged
              </div>
            )}

            {exercises.map((ex) => {
              const v = valsOf(ex);
              const todayLogs = bucket.logs.filter((l) => l.ex === ex.n && l.date === today);
              const todayN = todayLogs.length;
              const isDetailOpen = openDetail === ex.n;
              const isAnimating = animLogged === ex.n;
              const isFlashing = prFlash === ex.n;

              const cardCls = [
                'ex',
                todayN ? 'is-logged' : '',
                isAnimating ? 'logged-anim' : '',
                isFlashing ? 'pr-flash' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div key={ex.n} data-ex={ex.n} className={cardCls}>
                  <span className="ex-wipe" aria-hidden="true" />
                  <span className="ex-stamp" aria-hidden="true">Logged</span>

                  <div
                    className="ex-head"
                    onClick={() => setOpenDetail((cur) => (cur === ex.n ? null : ex.n))}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ex-name">
                        {ex.n}
                        {searchQuery && ex.group ? (
                          <span className="search-grouptag">{ex.group}</span>
                        ) : null}
                      </div>
                      <div className="ex-target">{ex.t}</div>
                      <div className="lastlog">{trendNode(ex)}</div>
                    </div>
                    {todayN ? (
                      <span className="pill-done">Logged{todayN > 1 ? ` ×${todayN}` : ''}</span>
                    ) : (
                      <span className="chev">{isDetailOpen ? '▴' : '▾'}</span>
                    )}
                  </div>

                  <div className="controls">
                    <div className="stepper">
                      <button type="button" onClick={() => bumpKg(ex, -2.5)}>−</button>
                      <div className="val">
                        <input
                          type="number"
                          step="0.5"
                          inputMode="decimal"
                          value={v.kg}
                          onChange={(e) => setKgInput(ex, e.target.value)}
                        />
                        <span className="unit">kg</span>
                      </div>
                      <button type="button" onClick={() => bumpKg(ex, 2.5)}>+</button>
                    </div>
                    <div className="stepper">
                      <button type="button" onClick={() => bumpReps(ex, -1)}>−</button>
                      <div className="val">
                        <input
                          type="number"
                          step="1"
                          inputMode="numeric"
                          value={v.reps}
                          onChange={(e) => setRepsInput(ex, e.target.value)}
                        />
                        <span className="unit">reps</span>
                      </div>
                      <button type="button" onClick={() => bumpReps(ex, 1)}>+</button>
                    </div>
                    <button
                      type="button"
                      className={`logbtn${todayN ? ' is-done' : ''}${isAnimating ? ' swipe done' : ''}`}
                      onClick={() => handleLogTap(ex)}
                      aria-label="Log set"
                    >
                      {todayN ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <>
                          <span className="lb-fill" aria-hidden="true" />
                          <span className="lb-ic lb-log">Log</span>
                          <span className="lb-ic lb-chk" aria-hidden="true">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {isDetailOpen && <DetailPanel ex={ex} logs={logsForEx(ex.n)} onRemove={() => {
                    if (typeof window !== 'undefined'
                      && window.confirm(`Remove "${ex.n}" from your exercise list? Logged history is kept.`)) {
                      removeExercise(ex.n);
                      showToast('Removed');
                    }
                  }} />}
                </div>
              );
            })}

            {!searchQuery && total === 0 && (
              <div className="empty">No exercises in this group yet</div>
            )}
            {searchQuery && total === 0 && (
              <div className="empty">No exercises match. Try another term.</div>
            )}

            {!searchQuery && (
              <button type="button" className="addcard" onClick={() => setModal('addExercise')}>
                <span className="ac-plus">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span>Add exercise to {category}</span>
              </button>
            )}
          </main>
        </>
      ) : (
        <main>
          {sessionDates.map((date) => {
            const list = bucket.logs.filter((l) => l.date === date).slice().reverse();
            const vol = list.reduce((s, l) => s + volume(l), 0);
            return (
              <div key={date}>
                <div className="session-date">
                  {fmtDate(date)}
                  <small>{vol > 0 ? `${nf(vol)} kg vol` : ''}</small>
                </div>
                {list.map((l) => (
                  <div key={l.id} className="hentry">
                    <div>
                      <div style={{ fontWeight: 600 }}>{l.ex}</div>
                      <div className="small">
                        {l.reps} reps @ <b>{l.kg} kg</b>
                      </div>
                    </div>
                    <button type="button" className="del" onClick={() => deleteLog(l.id)} aria-label="Delete log">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
          {sessionDates.length === 0 && <div className="empty">No workouts logged yet</div>}
        </main>
      )}
    </>
  );
}

/* ---- detail (history sparkline + mini-hist + remove) ---- */
function DetailPanel({
  ex,
  logs,
  onRemove,
}: {
  ex: PresetExercise;
  logs: LogEntry[];
  onRemove: () => void;
}) {
  const removeBtn = (
    <button type="button" className="removex" onClick={onRemove}>
      Remove this exercise from the list
    </button>
  );

  if (!logs.length) {
    return (
      <div className="detail open">
        <div className="empty" style={{ padding: '14px 0' }}>No history yet</div>
        {removeBtn}
      </div>
    );
  }

  const data = logs.map((l) => ({ d: l.date, v: l.kg ?? 0 }));
  const last = logs[logs.length - 1];

  return (
    <div className="detail open">
      <Chart
        height={110}
        draw={(ctx, w, h) => lineChart(ctx, w, h, data)}
        deps={[ex.n, logs.length, last?.id]}
      />
      <div className="mini-hist">
        {[...logs].reverse().slice(0, 5).map((l) => (
          <div key={l.id}>
            {fmtDate(l.date)} — <b>{l.kg} kg × {l.reps}</b>
          </div>
        ))}
      </div>
      {removeBtn}
    </div>
  );
}
