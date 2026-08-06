import { getPool, withConnection, type DbRow } from "@/lib/db/pool";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

type DbParam = string | number | boolean | Date | Buffer | null;
type DbParams = DbParam[];

export async function dbQuery<T extends DbRow[]>(sql: string, params: DbParams = []): Promise<T> {
  const [rows] = await getPool().query<T>(sql, params);
  return rows;
}

export async function dbExecute(sql: string, params: DbParams = []): Promise<void> {
  await getPool().execute(sql, params);
}

export async function dbInsert(sql: string, params: DbParams = []): Promise<number> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result.insertId;
}

export async function dbTransaction<T>(
  handler: (helpers: {
    query<R extends RowDataPacket[]>(sql: string, params?: DbParams): Promise<R>;
    execute(sql: string, params?: DbParams): Promise<ResultSetHeader>;
  }) => Promise<T>
): Promise<T> {
  return withConnection(async (conn) => {
    await conn.beginTransaction();

    try {
      const result = await handler({
        query: async <R extends RowDataPacket[]>(sql: string, params: DbParams = []) => {
          const [rows] = await conn.query<R>(sql, params);
          return rows;
        },
        execute: async (sql: string, params: DbParams = []) => {
          const [result] = await conn.execute<ResultSetHeader>(sql, params);
          return result;
        },
      });

      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  });
}
