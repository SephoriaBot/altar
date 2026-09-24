import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type Client } from '@libsql/client';
import { verifyToken } from '@clerk/backend';
import { randomUUID } from 'node:crypto';

let client: Client | null = null;
let ready: Promise<unknown> | null = null;

function getDb(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL is not set');

  client ??= createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return client;
}

async function ensureTable(db: Client) {
  ready ??= db.batch(
    [
      `CREATE TABLE IF NOT EXISTS readings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        spread_id TEXT NOT NULL,
        spread_name TEXT NOT NULL,
        question TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        cards TEXT NOT NULL
      )`,
      'CREATE INDEX IF NOT EXISTS readings_user_created_idx ON readings (user_id, created_at DESC)',
    ],
    'write',
  );

  await ready;
}

async function getUserId(req: VercelRequest): Promise<string | null> {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) return null;

  try {
    const verified = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    return verified.sub || null;
  } catch {
    return null;
  }
}

const clip = (v: unknown, max: number) =>
  typeof v === 'string' ? v.slice(0, max) : '';

interface SlotIn {
  id: number;
  rev: boolean;
}

function cleanCards(v: unknown): (SlotIn | null)[] | null {
  if (!Array.isArray(v) || v.length < 1 || v.length > 20) return null;

  const out: (SlotIn | null)[] = [];

  for (const s of v) {
    if (s === null) {
      out.push(null);
    } else if (
      s &&
      Number.isInteger(s.id) &&
      s.id >= 0 &&
      s.id < 78
    ) {
      out.push({
        id: s.id,
        rev: !!s.rev,
      });
    } else {
      return null;
    }
  }

  return out;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader('Cache-Control', 'no-store');

  if (!process.env.CLERK_SECRET_KEY) {
    return res.status(500).json({
      error: 'CLERK_SECRET_KEY is not set on the server.',
    });
  }

  const userId = await getUserId(req);

  if (!userId) {
    return res.status(401).json({
      error: 'Please sign in to use your journal.',
    });
  }

  try {
    const db = getDb();
    await ensureTable(db);

    if (req.method === 'GET') {
      const r = await db.execute({
        sql: `
          SELECT
            id,
            created_at,
            spread_id,
            spread_name,
            question,
            notes,
            cards
          FROM readings
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 100
        `,
        args: [userId],
      });

      const readings = r.rows.map((row) => ({
        id: String(row.id),
        createdAt: Number(row.created_at),
        spreadId: String(row.spread_id),
        spreadName: String(row.spread_name),
        question: String(row.question),
        notes: String(row.notes),
        cards: JSON.parse(String(row.cards)),
      }));

      return res.status(200).json({ readings });
    }

    if (req.method === 'POST') {
      const body = req.body ?? {};

      const cards = cleanCards(body.cards);
      const spreadId = clip(body.spreadId, 40);
      const spreadName = clip(body.spreadName, 80);

      if (!cards || !spreadId || !spreadName) {
        return res.status(400).json({
          error: 'A spread and at least one card are required.',
        });
      }

      const id = randomUUID();
      const createdAt = Date.now();

      await db.execute({
        sql: `
          INSERT INTO readings (
            id,
            user_id,
            created_at,
            spread_id,
            spread_name,
            question,
            notes,
            cards
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          id,
          userId,
          createdAt,
          spreadId,
          spreadName,
          clip(body.question, 300),
          clip(body.notes, 4000),
          JSON.stringify(cards),
        ],
      });

      return res.status(201).json({ id, createdAt });
    }

    if (req.method === 'DELETE') {
      const id = typeof req.query.id === 'string' ? req.query.id : '';

      if (!id) {
        return res.status(400).json({
          error: 'Missing id.',
        });
      }

      await db.execute({
        sql: 'DELETE FROM readings WHERE id = ? AND user_id = ?',
        args: [id, userId],
      });

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'The journal database could not be reached.',
    });
  }
}