import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const sql = await fs.readFile(new URL("../sql/001_initial_schema.sql", import.meta.url), "utf8");

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  multipleStatements: true,
});

try {
  await connection.query(sql);
  console.log("Migration completed: sql/001_initial_schema.sql");
} finally {
  await connection.end();
}
