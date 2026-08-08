import mysql, { type Pool, type PoolConnection, type RowDataPacket } from "mysql2/promise";

let pool: Pool | undefined;

function createPool(): Pool {
  if (!process.env.DB_HOST) {
    throw new Error("Database environment variables are not configured.");
  }

  const configuredConnectionLimit = Number(process.env.DB_CONNECTION_LIMIT ?? 4);
  const safeConnectionLimit = Number.isFinite(configuredConnectionLimit)
    ? Math.min(Math.max(1, configuredConnectionLimit), 4)
    : 4;

  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: safeConnectionLimit,
    maxIdle: 1,
    idleTimeout: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 30000),
    queueLimit: 0,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 10000),
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
}

export function getPool(): Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function withConnection<T>(handler: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    return await handler(conn);
  } finally {
    conn.release();
  }
}

export type DbRow = RowDataPacket;
