import type { Arc } from '../types';

function star(r: number) {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const a = ((-90 + i * 144) * Math.PI) / 180;
    d += (i ? 'L' : 'M') + (12 + r * Math.cos(a)).toFixed(2) + ' ' + (12 + r * Math.sin(a)).toFixed(2);
  }
  return d + 'Z';
}
const STAR = star(5.6);

export function Glyph({ arc }: { arc: Arc }) {
  const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <svg className="g" viewBox="0 0 24 24" aria-hidden="true" {...(arc === 'major' ? {} : line)}>
      {arc === 'wands' && (
        <>
          <path d="M5 19 16 8" />
          <path d="M14 4c3.5 0 6 2.5 6 6-3.5 0-6-2.5-6-6z" />
        </>
      )}
      {arc === 'cups' && (
        <>
          <path d="M6 5h12v3.5a6 6 0 0 1-12 0V5z" />
          <path d="M12 14.5V19" />
          <path d="M8.5 19.5h7" />
        </>
      )}
      {arc === 'swords' && (
        <>
          <path d="M12 3v12.5" />
          <path d="M7.5 12h9" />
          <path d="M12 15.5V21" />
        </>
      )}
      {arc === 'pents' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d={STAR} />
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
