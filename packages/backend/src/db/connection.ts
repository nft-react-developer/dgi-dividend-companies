import { drizzle } from 'drizzle-orm/mysql2';
import { createPool } from 'mysql2';
import type { Pool } from 'mysql2';
import * as schema from './schema';

let _db:   ReturnType<typeof drizzle<typeof schema>> | null = null;
let _pool: Pool | null = null;

export async function getDb(): Promise<ReturnType<typeof drizzle<typeof schema>>>  {
  if (_db) return _db;

  _pool = createPool({
    host:               process.env.DATABASE_HOST_NAME     ?? 'localhost',
    port:               Number(process.env.DB_PORT ?? 3306),
    user:               process.env.DATABASE_USER_NAME     ?? 'root',
    password:           process.env.DATABASE_USER_PASSWORD ?? '',
    database:           process.env.DATABASE_DB_NAME     ?? 'dgi_analyzer',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    enableKeepAlive:    true,
    keepAliveInitialDelay: 0,
  });

  _db = drizzle(_pool, { schema, mode: 'default' });
  return _db;
}

export async function closeDb() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db  = null;
  }
}

export async function getDbOrFail() {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');
  return db;
}

export async function testConnection(): Promise<boolean> {
  try {
    if (!_pool) await getDb();
    await _pool!.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('❌ DB connection error:', error);
    return false;
  }
}

export { schema };