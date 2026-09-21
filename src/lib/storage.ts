import type { ReadState, SavedReading, Slot } from '../types';
import { CARDS } from '../data/cards';
import { FOCUS } from '../data/lore';
import { DEFAULT_TRADITION, TRADITION_IDS } from '../data/traditions';
import { SPREADS } from '../data/spreads';

const READ_KEY = 'tarot-table:read:v1';
const JOURNAL_KEY = 'tarot-table:journal-key';

export const defaultRead = (): ReadState => ({ spread: 'ppf', cards: {}, rev: true, focus: 'general', free: 3, view: 'cards', tradition: DEFAULT_TRADITION });

export function loadRead(): ReadState {
  const r = defaultRead();
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return r;
    const s = JSON.parse(raw) as Partial<ReadState>;
    if (typeof s.rev === 'boolean') r.rev = s.rev;
    if (s.focus && FOCUS[s.focus]) r.focus = s.focus;
    if (s.view === 'cards' || s.view === 'together') r.view = s.view;
    if (s.tradition && TRADITION_IDS.includes(s.tradition)) r.tradition = s.tradition;
    if (Number.isInteger(s.free) && s.free! >= 1 && s.free! <= 12) r.free = s.free!;
    if (s.spread && (s.spread === 'free' || SPREADS.some((x) => x.id === s.spread))) r.spread = s.spread;
    if (s.cards && typeof s.cards === 'object') {
      for (const [k, arr] of Object.entries(s.cards)) {
        if (!(k === 'free' || SPREADS.some((x) => x.id === k)) || !Array.isArray(arr)) continue;
        r.cards[k] = arr.map((x) => (x && Number.isInteger(x.id) && CARDS[x.id] ? { id: x.id, rev: !!x.rev } : null));
      }
    }
  } catch {
    /* storage unavailable: start fresh */
  }
  return r;
}

export function saveRead(r: ReadState) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(r));
  } catch {
    /* ignore */
  }
}

export const getJournalKey = () => {
  try {
    return localStorage.getItem(JOURNAL_KEY) ?? '';
  } catch {
    return '';
  }
};
export const setJournalKey = (k: string) => {
  try {
    if (k) localStorage.setItem(JOURNAL_KEY, k);
    else localStorage.removeItem(JOURNAL_KEY);
  } catch {
    /* ignore */
  }
};

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', 'x-journal-key': getJournalKey(), ...(init.headers ?? {}) } });
  } catch {
    throw new Error('Could not reach the journal. Check your connection.');
  }
  const text = await res.text();
  let body: { error?: string } & Record<string, unknown> = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    /* not JSON, e.g. the dev server has no API */
  }
  if (!res.ok) {
    if (res.status === 404) throw new Error('The journal API is not running here. Use `vercel dev` locally, or the deployed site.');
    throw new Error(body.error || `Journal request failed (${res.status}).`);
  }
  return body as T;
}

export const listReadings = () => api<{ readings: SavedReading[] }>('/api/readings').then((r) => r.readings);

export const saveReadingRemote = (input: { spreadId: string; spreadName: string; question: string; notes: string; cards: (Slot | null)[] }) =>
  api<{ id: string }>('/api/readings', { method: 'POST', body: JSON.stringify(input) });

export const deleteReadingRemote = (id: string) => api<{ ok: true }>(`/api/readings?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
