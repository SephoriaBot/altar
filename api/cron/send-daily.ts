import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type Client } from '@libsql/client';
import * as webpush from 'web-push';
import { timingSafeEqual } from 'node:crypto';
import { dailyCard } from '../../src/lib/dailyCard.js';
import { CARDS } from '../../src/data/cards.js';

// Sends each person their daily card as a push notification.
// Call this once an hour (see the cron-job.org setup). It only sends to people whose
// local time has reached their reminder hour and who haven't had today's card yet,
// so calling it more often than needed is harmless.

let client: Client | null = null;

function getDb(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL is not set');
  client ??= createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return client;
}

function authorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.authorization;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

// The person's own calendar date (YYYY-MM-DD) and hour (0-23) in their time zone.
function localNow(tz: string, now: Date): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}

const firstSentence = (s: string) => (s.match(/^.*?[.!?](\s|$)/)?.[0] ?? s).trim();

interface Row {
  endpoint: string;
  user_id: string;
  p256dh: string;
  auth: string;
  tz: string;
  hour: number;
  last_sent: string | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized.' });

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return res.status(500).json({ error: 'Push keys are not configured.' });
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const force = req.query.force === '1'; // for testing: ignore the hour and "already sent today"
  const now = new Date();
  const result = { checked: 0, sent: 0, removed: 0, failed: 0 };

  try {
    const db = getDb();
    let rows: Row[];
    try {
      rows = (await db.execute('SELECT * FROM push_subscriptions')).rows as unknown as Row[];
    } catch {
      return res.status(200).json(result); // table not created yet: nobody has subscribed
    }

    for (const row of rows) {
      result.checked++;

      let local;
      try {
        local = localNow(row.tz, now);
      } catch {
        continue;
      }
      if (!force && (local.hour < row.hour || row.last_sent === local.date)) continue;

      // Claim today's send first so overlapping runs can't send it twice.
      const claim = await db.execute({
        sql: `UPDATE push_subscriptions SET last_sent = ?
              WHERE endpoint = ? AND (last_sent IS NULL OR last_sent != ? OR ? = 1)`,
        args: [local.date, row.endpoint, local.date, force ? 1 : 0],
      });
      if (claim.rowsAffected === 0) continue;

      const slot = dailyCard(row.user_id, local.date);
      const card = CARDS[slot.id];
      if (!card) continue;

      const payload = JSON.stringify({
        title: `Your card for today: ${card.name}${slot.rev ? ' (reversed)' : ''}`,
        body: firstSentence(slot.rev ? card.rev : card.up),
        url: '/',
      });

      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          payload,
          { TTL: 60 * 60 * 12 },
        );
        result.sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // The device unsubscribed or the subscription expired.
          await db.execute({ sql: 'DELETE FROM push_subscriptions WHERE endpoint = ?', args: [row.endpoint] });
          result.removed++;
        } else {
          // Temporary problem: release the claim so the next run tries again.
          await db.execute({
            sql: 'UPDATE push_subscriptions SET last_sent = ? WHERE endpoint = ?',
            args: [row.last_sent, row.endpoint],
          });
          result.failed++;
        }
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not send reminders.' });
  }
}
