import { useCallback, useEffect, useState } from 'react';
import type { SavedReading } from '../types';
import { CARDS } from '../data/cards';
import { deleteReadingRemote, getJournalKey, listReadings, setJournalKey } from '../lib/storage';

export function JournalTab({ onOpen }: { onOpen: (r: SavedReading) => void }) {
  const [key, setKey] = useState(getJournalKey());
  const [draft, setDraft] = useState('');
  const [items, setItems] = useState<SavedReading[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setErr('');
    try {
      setItems(await listReadings());
    } catch (e) {
      setItems(null);
      setErr(e instanceof Error ? e.message : 'Could not load the journal.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (key) void load();
  }, [key, load]);

  if (!key) {
    return (
      <>
        <h1>Journal</h1>
        <p className="muted">Saved readings live in your own Turso database. Enter the journal key you set as JOURNAL_KEY on Vercel. It stays in this browser.</p>
        <label className="lbl" htmlFor="jk">
          Journal key
        </label>
        <input id="jk" className="field" type="password" value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="off" />
        <div className="acts">
          <button
            type="button"
            className="btn"
            disabled={!draft.trim()}
            onClick={() => {
              setJournalKey(draft.trim());
              setKey(draft.trim());
              setDraft('');
            }}
          >
            Unlock journal
          </button>
        </div>
      </>
    );
  }

  const remove = async (id: string) => {
    if (armed !== id) {
      setArmed(id);
      window.setTimeout(() => setArmed((a) => (a === id ? null : a)), 3000);
      return;
    }
    try {
      await deleteReadingRemote(id);
      setItems((l) => (l ? l.filter((r) => r.id !== id) : l));
      setArmed(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  const wrongKey = /key/i.test(err);
  return (
    <>
      <h1>Journal</h1>
      <p className="muted">Your saved readings, newest first.</p>
      <div className="acts">
        <button type="button" className="btn ghost sm" onClick={load} disabled={busy}>
          {busy ? 'Loading' : 'Refresh'}
        </button>
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => {
            setJournalKey('');
            setKey('');
            setItems(null);
            setErr('');
          }}
        >
          {wrongKey ? 'Enter a different key' : 'Lock journal'}
        </button>
      </div>
      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}
      {items && items.length === 0 && <p className="empty-note">Nothing saved yet. Enter a reading and use Save reading at the bottom of the Read tab.</p>}
      {items?.map((r) => (
        <article key={r.id} className="jr">
          <p className="when">{new Date(r.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
          <h3>{r.question || r.spreadName}</h3>
          {r.question && <p className="muted small">{r.spreadName}</p>}
          <p className="small">
            {r.cards
              .map((s, i) => (s && CARDS[s.id] ? `${i + 1}. ${CARDS[s.id].name}${s.rev ? ' (reversed)' : ''}` : null))
              .filter(Boolean)
              .join(', ')}
          </p>
          {r.notes && <p>{r.notes}</p>}
          <div className="acts">
            <button type="button" className="btn ghost sm" onClick={() => onOpen(r)}>
              Open in Read
            </button>
            <button type="button" className="btn ghost sm" onClick={() => remove(r.id)}>
              {armed === r.id ? 'Tap again to delete' : 'Delete'}
            </button>
          </div>
        </article>
      ))}
    </>
  );
}
