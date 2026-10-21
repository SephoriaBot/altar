import { verifyToken } from '@clerk/backend';
import type { VercelRequest } from '@vercel/node';

// Demo visitors get a random "guest_<32 hex>" id from their browser. It can never collide
// with a Clerk id ("user_..."), and being random it works like a private key to that
// guest's own data.
const GUEST_RE = /^guest_[0-9a-f]{32}$/;
export const isGuestId = (v: string | null | undefined): v is string => !!v && GUEST_RE.test(v);

// Returns the Clerk user id from a *verified* session token, or null.
// The user id is never read from the request body or query string.
export async function getUserId(req: VercelRequest): Promise<string | null> {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) return null;

  const token = authorization.slice('Bearer '.length).trim();
  if (isGuestId(token)) return token;
  if (!token || !process.env.CLERK_SECRET_KEY) return null;

  try {
    const verified = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return verified.sub || null;
  } catch {
    return null;
  }
}
