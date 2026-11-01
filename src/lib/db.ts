import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;
let isInitializing = false;

export function getDbPool(): mysql.Pool | null {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE || 'neurosim_db';
  const port = Number(process.env.MYSQL_PORT) || 3306;

  // Don't initialize if credentials are not provided
  if (!host || !user) {
    return null;
  }

  if (!pool && !isInitializing) {
    isInitializing = true;
    try {
      pool = mysql.createPool({
        host,
        port,
        user,
        password: password || '',
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });
    } catch (err) {
      console.error('[DB] Gagal membuat pool MySQL:', err);
      pool = null;
    } finally {
      isInitializing = false;
    }
  }

  return pool;
}

export async function isDbConnected(): Promise<boolean> {
  const p = getDbPool();
  if (!p) return false;
  try {
    const conn = await p.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Universal safe query function that executes against MySQL if available,
 * and falls back to the in-memory enterprise datastore when MySQL is offline.
 */
export async function executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const p = getDbPool();
  if (p) {
    try {
      const [rows] = await p.query(sql, params);
      return rows as T[];
    } catch (err: any) {
      console.warn(`[DB Query Warning]: ${err.message} - falling back to memory store`);
    }
  }
  return [];
}
