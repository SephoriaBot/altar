import { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { disablePush, enablePush, getPushState, isIos, type PushState } from '../lib/push';

export function ReminderToggle() {
  const { isGuest, getToken } = useAuth();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    getPushState()
      .then((s) => alive && setState(s))
      .catch(() => alive && setState('unsupported'));
    return () => {
      alive = false;
    };
  }, []);

  // Reminders belong to a real account, and need a browser that can do push.
  if (isGuest || !state || state === 'unsupported') return null;

  async function run(action: () => Promise<PushState>) {
    setBusy(true);
    setError('');
    try {
      setState(await action());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="home-reminder">
      <p className="home-card-label">Daily reminder</p>

      {state === 'needs-install' && (
        <p>
          To get your card each morning, add Altar to your Home Screen (Share, then Add to Home
          Screen), open it from there, and come back here.
        </p>
      )}

      {state === 'blocked' && (
        <p>
          Notifications are blocked for Altar. Turn them on in your {isIos() ? 'iPhone' : 'browser'}{' '}
          settings, then come back here.
        </p>
      )}

      {state === 'off' && (
        <>
          <p>Get your card as a notification each morning.</p>
          <button type="button" disabled={busy} onClick={() => run(() => enablePush(getToken))}>
            {busy ? 'One moment…' : 'Remind me daily'}
          </button>
        </>
      )}

      {state === 'on' && (
        <>
          <p>Your card will arrive each morning.</p>
          <button type="button" disabled={busy} onClick={() => run(() => disablePush(getToken))}>
            {busy ? 'One moment…' : 'Turn off reminder'}
          </button>
        </>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  );
}
