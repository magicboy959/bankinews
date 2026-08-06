import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const sqlDir = new URL("../sql/", import.meta.url);
const files = await fs.readdir(sqlDir);
const migrationFiles = files.filter((file) => file.endsWith(".sql")).sort();

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
  for (const file of migrationFiles) {
    const sql = await fs.readFile(new URL(`../sql/${file}`, import.meta.url), "utf8");
    await connection.query(sql);
    console.log(`Migration completed: sql/${file}`);
  }
} finally {
  await connection.end();
}
