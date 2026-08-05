import { getPool, type DbRow } from "@/lib/db/pool";

export async function dbQuery<T extends DbRow[]>(sql: string, params: unknown[] = []): Promise<T> {
  const [rows] = await getPool().query<T>(sql, params);
  return rows;
}

export async function dbExecute(sql: string, params: any[] = []): Promise<void> {
  await getPool().execute(sql, params as any);
}
