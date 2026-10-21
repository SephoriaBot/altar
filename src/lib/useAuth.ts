import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useAuth as useClerkAuth } from '@clerk/react';

// Demo mode: a random "guest_<32 hex>" id kept in this browser. With nobody signed in, it
// stands in for the user, so the whole app (journal, home, charts) works without an account.
const GUEST_KEY = 'altar:guest';
const GUEST_RE = /^guest_[0-9a-f]{32}$/;

let memoryGuest: string | null = null; // fallback if localStorage is blocked
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function readGuest(): string | null {
  try {
    const v = localStorage.getItem(GUEST_KEY);
    if (v && GUEST_RE.test(v)) return v;
  } catch {
    /* ignore storage failures (e.g. private browsing) */
  }
  return memoryGuest;
}

export function startGuest() {
  const token = readGuest() ?? `guest_${crypto.randomUUID().replace(/-/g, '')}`;
  memoryGuest = token;
  try {
    localStorage.setItem(GUEST_KEY, token);
  } catch {
    /* ignore storage failures */
  }
  emit();
}

export function forgetGuest() {
  memoryGuest = null;
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore storage failures */
  }
  emit();
}

// "Exit demo": wipe the guest's data on the server, then forget the id.
export async function exitGuest() {
  const token = readGuest();
  if (token) {
    await fetch('/api/guest', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  forgetGuest();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

// Same shape as Clerk's useAuth for what Altar uses, but a demo guest counts as signed in.
export function useAuth() {
  const clerk = useClerkAuth();
  const guest = useSyncExternalStore(subscribe, readGuest, () => null);
  const isGuest = clerk.isLoaded && !clerk.isSignedIn && !!guest;

  // A real sign-in always wins; drop the leftover demo id.
  useEffect(() => {
    if (clerk.isSignedIn && guest) forgetGuest();
  }, [clerk.isSignedIn, guest]);

  const guestToken = useCallback(async () => guest, [guest]);
  const getToken = (isGuest ? guestToken : clerk.getToken) as () => Promise<string | null>;

  return {
    isLoaded: clerk.isLoaded,
    isSignedIn: !!clerk.isSignedIn || isGuest,
    isGuest,
    getToken,
  };
}
