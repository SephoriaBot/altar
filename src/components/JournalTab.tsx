import { useCallback, useEffect, useState } from 'react';
import { SignInButton, useAuth } from '@clerk/react';
import type { SavedReading } from '../types';
import { deleteReadingRemote, listReadings } from '../lib/storage';
import { useTradition } from '../lib/tradition';

export function JournalTab({ onOpen }: { onOpen: (r: SavedReading) => void }) {
  const T = useTradition();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [items, setItems] = useState<SavedReading[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSignedIn) return;

    setBusy(true);
    setErr('');

    try {
      setItems(await listReadings(getToken));
    } catch (e) {
      setItems(null);
      setErr(e instanceof Error ? e.message : 'Could not load the journal.');
    } finally {
      setBusy(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (isSignedIn) {
      void load();
    } else {
      setItems(null);
    }
  }, [isSignedIn, load]);

  if (!isLoaded) {
    return (
      <>
        <h1>Journal</h1>
        <p className="muted">Loading...</p>
      </>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <h1>Journal</h1>
        <p className="muted">
          Sign in to save and view your personal tarot readings.
        </p>

        <div className="acts">
          <SignInButton mode="modal">
            <button type="button" className="btn">
              Sign in to your journal
            </button>
          </SignInButton>
        </div>
      </>
    );
  }

  const remove = async (id: string) => {
    if (armed !== id) {
      setArmed(id);
      window.setTimeout(
        () => setArmed((a) => (a === id ? null : a)),
        3000,
      );
      return;
    }

    try {
      await deleteReadingRemote(getToken, id);
      setItems((l) => (l ? l.filter((r) => r.id !== id) : l));
      setArmed(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  return (
    <>
      <h1>Journal</h1>
      <p className="muted">Your saved readings, newest first.</p>

      <div className="acts">
        <button
          type="button"
          className="btn ghost sm"
          onClick={load}
          disabled={busy}
        >
          {busy ? 'Loading' : 'Refresh'}
        </button>
      </div>

      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}

      {items && items.length === 0 && (
        <p className="empty-note">
          Nothing saved yet. Enter a reading and use Save reading at the
          bottom of the Read tab.
        </p>
      )}

      {items?.map((r) => (
        <article key={r.id} className="jr">
          <p className="when">
            {new Date(r.createdAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>

          <h3>{r.question || r.spreadName}</h3>

          {r.question && <p className="muted small">{r.spreadName}</p>}

          <p className="small">
            {r.cards
              .map((s, i) =>
                s && T.cards[s.id]
                  ? `${i + 1}. ${T.cards[s.id].name}${
                      T.reversals && s.rev ? ' (reversed)' : ''
                    }`
                  : null,
              )
              .filter(Boolean)
              .join(', ')}
          </p>

          {r.notes && <p>{r.notes}</p>}

          <div className="acts">
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => onOpen(r)}
            >
              Open in Read
            </button>

            <button
              type="button"
              className="btn ghost sm"
              onClick={() => remove(r.id)}
            >
              {armed === r.id ? 'Tap again to delete' : 'Delete'}
            </button>
          </div>
        </article>
      ))}
    </>
  );
}