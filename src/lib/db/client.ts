import { createClient, type Client } from '@libsql/client';

let client: Client | null = null;

/**
 * Lazily-created Turso client, reused across invocations within the same
 * serverless function instance. Requires TURSO_DATABASE_URL and
 * TURSO_AUTH_TOKEN to be set in Vercel's environment variables.
 */
export function getDbClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      throw new Error(
        'Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.',
      );
    }

    client = createClient({ url, authToken });
  }

  return client;
}
