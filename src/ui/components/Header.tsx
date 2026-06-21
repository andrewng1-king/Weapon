'use client';

import { useWeapon, useUIStore } from '@/hooks';

export function Header() {
  const { state, toggleLogo } = useWeapon();
  const setMenuOpen = useUIStore((s) => s.setMenuOpen);
  if (!state) return null;

  const bolt = (
    <svg viewBox="0 0 28 44" aria-hidden>
      <path fill="currentColor" d="M17.5 0 1.5 26.5H11L8.5 44 26.5 16H16.5L21.5 0Z" />
    </svg>
  );

  return (
    <header>
      <button className="hdr-menu" onClick={() => setMenuOpen(true)} aria-label="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <div className="brand-wrap">
        <div className="brand-logo" onClick={toggleLogo} role="button" tabIndex={0} aria-label="Switch logo">
          {state.logo === 'athlete' ? (
            <>
              <span className="bl-part">ATH</span>
              <span className="bl-bolt">{bolt}</span>
              <span className="bl-part">LETE</span>
            </>
          ) : (
            <>
              <span className="bl-part">WEA</span>
              <span className="bl-bolt">{bolt}</span>
              <span className="bl-part">ON</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
