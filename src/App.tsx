import { useEffect, useRef, useState } from 'react';
import type { Card, ReadState, SavedReading } from './types';
import { CardDetail } from './components/CardDetail';
import { CardsTab } from './components/CardsTab';
import { Icons } from './components/Glyph';
import { JournalTab } from './components/JournalTab';
import { ReadTab } from './components/ReadTab';
import { SpreadsTab } from './components/SpreadsTab';
import { loadRead, saveRead } from './lib/storage';

type Tab = 'spreads' | 'read' | 'cards' | 'journal';
const TABS: [Tab, string, keyof typeof Icons][] = [
  ['spreads', 'Spreads', 'spreads'],
  ['read', 'Read', 'read'],
  ['cards', 'Cards', 'cards'],
  ['journal', 'Journal', 'journal'],
];

export default function App() {
  const [tab, setTab] = useState<Tab>('spreads');
  const [openSpread, setOpenSpread] = useState<string | null>(null);
  const [read, setReadState] = useState<ReadState>(loadRead);
  const [info, setInfo] = useState<Card | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => saveRead(read), [read]);

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
    <>
      <div className="shell">
        <div className="brand">
          {Icons.moon}
          Tarot Table
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
              onCardInfo={setInfo}
              toast={toast}
            />
          )}
          {tab === 'cards' && <CardsTab onOpen={setInfo} />}
          {tab === 'journal' && <JournalTab onOpen={openSaved} />}
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

      <CardDetail card={info} onClose={() => setInfo(null)} onOpen={setInfo} />
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
    </>
  );
}
