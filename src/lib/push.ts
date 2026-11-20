// Browser side of daily reminders: ask permission, subscribe, tell the server.

const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushState = 'unsupported' | 'needs-install' | 'blocked' | 'off' | 'on';

export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

function urlBase64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const padded = (b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration() {
  return navigator.serviceWorker.ready;
}

export async function getPushState(): Promise<PushState> {
  if (!PUBLIC_KEY || !('serviceWorker' in navigator)) return 'unsupported';
  // iPhones only allow push for apps added to the Home Screen.
  if (isIos() && !isInstalled()) return 'needs-install';
  if (!('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  const sub = await (await registration()).pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'on' : 'off';
}

async function send(method: 'POST' | 'DELETE', token: string, body: unknown) {
  const res = await fetch('/api/push', {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || 'Something went wrong.');
  }
}

export async function enablePush(getToken: () => Promise<string | null>): Promise<PushState> {
  if (!PUBLIC_KEY) throw new Error('Reminders are not set up yet.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off';

  const reg = await registration();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBytes(PUBLIC_KEY),
    }));

  const token = await getToken();
  if (!token) throw new Error('Please sign in again.');
  await send('POST', token, {
    subscription: sub.toJSON(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  return 'on';
}

export async function disablePush(getToken: () => Promise<string | null>): Promise<PushState> {
  const sub = await (await registration()).pushManager.getSubscription();
  if (sub) {
    const token = await getToken();
    if (token) await send('DELETE', token, { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe();
  }
  return 'off';
}
