import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type Client } from '@libsql/client';
import { getUserId, isGuestId } from './_lib/auth.js';

let client: Client | null = null;
let ready: Promise<unknown> | null = null;

function getDb(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL is not set');
  client ??= createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return client;
}

async function ensureTable(db: Client) {
  ready ??= db.batch(
    [
      `CREATE TABLE IF NOT EXISTS push_subscriptions (
        endpoint TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        tz TEXT NOT NULL DEFAULT 'UTC',
        hour INTEGER NOT NULL DEFAULT 8,
        last_sent TEXT,
        created_at INTEGER NOT NULL
      )`,
      'CREATE INDEX IF NOT EXISTS push_user_idx ON push_subscriptions (user_id)',
    ],
    'write',
  );
  await ready;
}

const MAX_PER_USER = 5;

// Only real browser push services. The server will later send to these addresses,
// so an arbitrary URL here would let someone aim our server at any website.
const PUSH_HOSTS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.apple.com',
  'notify.windows.com',
];

function isPushEndpoint(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 600) return false;
  try {
    const u = new URL(v);
    if (u.protocol !== 'https:') return false;
    return PUSH_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

const isKey = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= 200 && /^[A-Za-z0-9_-]+=*$/.test(v);

function isTimeZone(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: v });
    return true;
  } catch {
    return false;
  }
}

// POST   /api/push  { subscription, tz }  save this device for daily reminders
// DELETE /api/push  { endpoint }          stop reminders for this device
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
  if (isGuestId(userId)) {
    return res.status(403).json({ error: 'Sign in to get daily reminders.' });
  }

  try {
    const db = getDb();
    await ensureTable(db);
    const body = req.body ?? {};

    if (req.method === 'DELETE') {
      if (!isPushEndpoint(body.endpoint)) return res.status(400).json({ error: 'Invalid request.' });
      await db.execute({
        sql: 'DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?',
        args: [body.endpoint, userId],
      });
      return res.status(204).end();
    }

    const sub = body.subscription;
    const endpoint = sub?.endpoint;
    const p256dh = sub?.keys?.p256dh;
    const auth = sub?.keys?.auth;
    if (!isPushEndpoint(endpoint) || !isKey(p256dh) || !isKey(auth) || !isTimeZone(body.tz)) {
      return res.status(400).json({ error: 'Invalid request.' });
    }

    const count = await db.execute({
      sql: 'SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ? AND endpoint != ?',
      args: [userId, endpoint],
    });
    if (Number(count.rows[0]?.n ?? 0) >= MAX_PER_USER) {
      return res.status(400).json({ error: 'Too many devices. Turn reminders off on one first.' });
    }

    await db.execute({
      sql: `INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth, tz, hour, created_at)
            VALUES (?, ?, ?, ?, ?, 8, ?)
            ON CONFLICT(endpoint) DO UPDATE SET
              user_id = excluded.user_id,
              p256dh = excluded.p256dh,
              auth = excluded.auth,
              tz = excluded.tz`,
      args: [endpoint, userId, p256dh, auth, body.tz, Date.now()],
    });
    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not save your reminder.' });
  }
}
