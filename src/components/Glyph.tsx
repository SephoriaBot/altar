import type { Arc, TraditionId } from '../types';

function star(r: number) {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const a = ((-90 + i * 144) * Math.PI) / 180;
    d += (i ? 'L' : 'M') + (12 + r * Math.cos(a)).toFixed(2) + ' ' + (12 + r * Math.sin(a)).toFixed(2);
  }
  return d + 'Z';
}
const STAR = star(5.6);

export function Glyph({ arc, tradition = 'rws' }: { arc: Arc; tradition?: TraditionId }) {
  const m = tradition === 'marseille';
  const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <svg className="g" viewBox="0 0 24 24" aria-hidden="true" {...(arc === 'major' ? {} : line)}>
      {arc === 'wands' && !m && (
        <>
          <path d="M5 19 16 8" />
          <path d="M14 4c3.5 0 6 2.5 6 6-3.5 0-6-2.5-6-6z" />
        </>
      )}
      {arc === 'wands' && m && (
        <>
          <path d="M6 20C9 14 14 9 19 5" />
          <path d="M9.5 15.5 7 14M13 11.5l-2.5-2.5M16 8.5l-1-3" />
        </>
      )}
      {arc === 'cups' && (
        <>
          <path d="M6 5h12v3.5a6 6 0 0 1-12 0V5z" />
          <path d="M12 14.5V19" />
          <path d="M8.5 19.5h7" />
        </>
      )}
      {arc === 'swords' && !m && (
        <>
          <path d="M12 3v12.5" />
          <path d="M7.5 12h9" />
          <path d="M12 15.5V21" />
        </>
      )}
      {arc === 'swords' && m && (
        <>
          <path d="M8 3c6 2 7.5 8 3 12.5" />
          <path d="M7 14.5l7 3" />
          <path d="M10 16.5 7 21" />
        </>
      )}
      {arc === 'pents' && !m && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d={STAR} />
        </>
      )}
      {arc === 'pents' && m && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6.5 13.6 10.4 17.5 12 13.6 13.6 12 17.5 10.4 13.6 6.5 12 10.4 10.4z" />
        </>
      )}
      {arc === 'major' && <path d="M12 2.5l2.2 6.8 6.8 2.2-6.8 2.2-2.2 6.8-2.2-6.8-6.8-2.2 6.8-2.2z" fill="currentColor" />}
    </svg>
  );
}

export const Icons = {
  spreads: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="5" height="8" rx="1.5" />
      <rect x="9.5" y="5" width="5" height="8" rx="1.5" />
      <rect x="16" y="5" width="5" height="8" rx="1.5" />
      <rect x="9.5" y="15" width="5" height="5" rx="1.5" />
    </svg>
  ),
  read: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l2 5.5 5.5 2-5.5 2L12 18l-2-5.5-5.5-2 5.5-2z" />
      <path d="M19 17v4M17 19h4" />
    </svg>
  ),
  cards: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="6" width="10" height="14" rx="2" />
      <path d="M8 3h9a3 3 0 0 1 3 3v11" />
    </svg>
  ),
  journal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M9 9h6M9 13h4" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v5.8M12 15.2V21M3 12h5.8M15.2 12H21" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor" />
    </svg>
  ),
};
