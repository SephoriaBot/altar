import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@libsql/client';
import { getUserId, isGuestId } from './_lib/auth.js';

// DELETE /api/guest wipes everything the calling demo guest created ("Exit demo").
// It only ever works for guest ids, never for real accounts.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const userId = await getUserId(req);
  if (!isGuestId(userId)) return res.status(401).json({ error: 'Unauthorized.' });

  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return res.status(500).json({ error: 'Server is not configured correctly.' });

  try {
    const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    const statements = [
      'DELETE FROM chart_placements WHERE chart_id IN (SELECT id FROM natal_charts WHERE user_id = ?)',
      'DELETE FROM natal_charts WHERE user_id = ?',
      'DELETE FROM readings WHERE user_id = ?',
    ];
    for (const sql of statements) {
      try {
        await db.execute({ sql, args: [userId] });
      } catch {
        /* the table may not exist yet; nothing to wipe */
      }
    }
    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not clear demo data.' });
  }
}
