'use client';

import { useEffect } from 'react';
import type { WeaponState } from '@/domain/types';
import { ACCENT_SET } from '@/domain/accents';

const THEMES = {
  dark: {
    page: '#0a0a0b', panel: '#0e0f11', panel2: '#141517',
    ink: '#e9e7e3', muted: '#9b9a96', faint: '#6a6a67',
    line: 'rgba(255,255,255,.07)', line2: 'rgba(255,255,255,.04)',
    track: 'rgba(255,255,255,.08)', hair: 'rgba(255,255,255,.14)',
    nav: 'rgba(10,10,11,.92)', grid: 'rgba(255,255,255,.10)',
    step: '#000000', stepInk: '#e9e7e3',
  },
  light: {
    page: '#ece9e3', panel: '#f6f4ef', panel2: '#ffffff',
    ink: '#1b1a17', muted: '#5f5d57', faint: '#8b8881',
    line: 'rgba(0,0,0,.10)', line2: 'rgba(0,0,0,.05)',
    track: 'rgba(0,0,0,.09)', hair: 'rgba(0,0,0,.16)',
    nav: 'rgba(246,244,239,.92)', grid: 'rgba(0,0,0,.10)',
    step: '#d4cfc4', stepInk: '#15140f',
  },
} as const;

export function useThemeSync(state: WeaponState | null) {
  useEffect(() => {
    if (!state) return;
    const body = document.body;
    body.setAttribute('data-sport', state.sport);
    body.setAttribute('data-theme', state.theme);
    body.classList.toggle('dense', state.layout === 'dense');

    const accent = ACCENT_SET[state.dev.color] ?? ACCENT_SET[0];
    const s = body.style;
    s.setProperty('--accent', accent.hex);
    s.setProperty('--accent-dim', accent.dim);
    s.setProperty('--accent-rgb', accent.rgb);
    s.setProperty('--accent-ink', accent.ink);
    s.setProperty('--gold', accent.hex);

    const t = THEMES[state.theme] ?? THEMES.dark;
    s.setProperty('--page', t.page);
    s.setProperty('--panel', t.panel);
    s.setProperty('--panel-2', t.panel2);
    s.setProperty('--ink', t.ink);
    s.setProperty('--muted', t.muted);
    s.setProperty('--faint', t.faint);
    s.setProperty('--line', t.line);
    s.setProperty('--line-2', t.line2);
    s.setProperty('--track', t.track);
    s.setProperty('--hair', t.hair);
    s.setProperty('--nav-bg', t.nav);
    s.setProperty('--grid', t.grid);
    s.setProperty('--step-bg', t.step);
    s.setProperty('--step-ink', t.stepInk);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.page);
  }, [state?.sport, state?.theme, state?.layout, state?.dev.color]);
}
