import { useEffect, useRef, useState } from 'react';
import { SignIn, SignUp, useAuth } from '@clerk/react';
import type { Card, ReadState, SavedReading } from './types';
import { CardDetail } from './components/CardDetail';
import { CardsTab } from './components/CardsTab';
import { ChartTab } from './components/ChartTab';
import { Icons } from './components/Glyph';
import { JournalTab } from './components/JournalTab';
import { ReadTab } from './components/ReadTab';
import { SpreadsTab } from './components/SpreadsTab';
import { TRADITIONS, TRADITION_IDS } from './data/traditions';
import { loadRead, saveRead } from './lib/storage';
import { TraditionProvider } from './lib/tradition';

type Tab = 'spreads' | 'read' | 'cards' | 'journal' | 'chart';
const TABS: [Tab, string, keyof typeof Icons][] = [
  ['spreads', 'Spreads', 'spreads'],
  ['read', 'Read', 'read'],
  ['cards', 'Cards', 'cards'],
  ['journal', 'Journal', 'journal'],
  ['chart', 'Chart', 'chart'],
];

export default function App() {
  const { isLoaded, isSignedIn } = useAuth();

const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    if (isLoaded && !isSignedIn && path !== '/sign-in' && path !== '/sign-up') {
      window.location.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, path]);

  const [tab, setTab] = useState<Tab>('spreads');
  const [openSpread, setOpenSpread] = useState<string | null>(null);
  const [read, setReadState] = useState<ReadState>(loadRead);
  const [infoId, setInfoId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>(
  window.location.pathname === '/sign-up' ? 'sign-up' : 'sign-in',
);
  if (!isLoaded) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand">
            {Icons.moon}
            Tarot Table
          </div>
          <p className="muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand">
            {Icons.moon}
            Tarot Table
          </div>

          <p className="auth-subtitle">
            Your personal space for tarot readings, journals, and birth charts.
          </p>

         {path === '/sign-up' || authMode === 'sign-up' ? (
            <>
              <SignIn routing="path" path="/sign-in" />
              <p className="auth-switch">
                New to Tarot Table?{' '}
                <button
  type="button"
  onClick={() => {
  window.history.pushState({}, '', '/sign-up');
  setPath('/sign-up');
  setAuthMode('sign-up');
}}
>
  Create an account
</button>
              </p>
            </>
          ) : (
            <>
             <SignUp routing="path" path="/sign-up" />
              <p className="auth-switch">
                Already have an account?{' '}
                <button
  type="button"
  onClick={() => {
  window.history.pushState({}, '', '/sign-in');
  setPath('/sign-in');
  setAuthMode('sign-in');
}}
>
  Sign in
</button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  useEffect(() => saveRead(read), [read]);

  const T = TRADITIONS[read.tradition];
  const showCard = (c: Card) => setInfoId(c.id);

  const setRead = (fn: (r: ReadState) => ReadState) => setReadState((r) => fn(r));
  const go = (t: Tab) => {
    setTab(t);
    setOpenSpread(null);
    window.scrollTo(0, 0);
  };
  const toast = (m: string) => {
    setToastMsg(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(''), 2200);
  };
  const useSpread = (id: string) => {
    setRead((r) => ({ ...r, spread: id }));
    go('read');
  };
  const openSaved = (s: SavedReading) => {
    const isFree = s.spreadId === 'free';
    setRead((r) => ({ ...r, spread: s.spreadId, free: isFree ? Math.min(12, Math.max(1, s.cards.length)) : r.free, cards: { ...r.cards, [s.spreadId]: s.cards } }));
    go('read');
  };

  return (
    <TraditionProvider value={T}>
      <div className="shell">
        <div className="brand">
          {Icons.moon}
          Tarot Table
        </div>
        <div className="trad">
          <div className="seg" role="group" aria-label="Interpretation tradition">
            {TRADITION_IDS.map((id) => (
              <button key={id} type="button" aria-pressed={read.tradition === id} onClick={() => setRead((r) => ({ ...r, tradition: id }))}>
                {TRADITIONS[id].label}
              </button>
            ))}
          </div>
          <p className="muted small">{T.tagline}</p>
        </div>
        <main>
          {tab === 'spreads' && (
            <SpreadsTab
              openId={openSpread}
              setOpenId={(id) => {
                setOpenSpread(id);
                window.scrollTo(0, 0);
              }}
              onUse={useSpread}
            />
          )}
          {tab === 'read' && (
            <ReadTab
              read={read}
              setRead={setRead}
              onOpenSpread={(id) => {
                setTab('spreads');
                setOpenSpread(id);
                window.scrollTo(0, 0);
              }}
              onCardInfo={showCard}
              toast={toast}
            />
          )}
          {tab === 'cards' && <CardsTab onOpen={showCard} />}
          {tab === 'journal' && <JournalTab onOpen={openSaved} />}
          {tab === 'chart' && <ChartTab />}
        </main>
      </div>

      <nav className="tabs" aria-label="Sections">
        <div className="tabs-in">
          {TABS.map(([id, label, icon]) => (
            <button key={id} type="button" className="tab" aria-current={tab === id ? 'page' : undefined} onClick={() => go(id)}>
              {Icons[icon]}
              {label}
            </button>
          ))}
        </div>
      </nav>
      <CardDetail card={infoId === null ? null : T.cards[infoId]} onClose={() => setInfoId(null)} onOpen={showCard} />
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
    </TraditionProvider>
  );
}
