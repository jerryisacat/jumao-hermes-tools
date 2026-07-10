import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== 'test') {
  console.warn('[db] DATABASE_URL is not set; database calls will fail until configured.');
}

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected idle client error:', err.message);
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: readonly unknown[]
): Promise<pg.QueryResult<T>> {
  const client = await pool.connect();
  try {
    return await client.query<T>(text, params as unknown[] | undefined);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[db] Query error:', msg, '| SQL:', text);
    throw err;
  } finally {
    client.release();
  }
}

export type { QueryResult } from 'pg';
