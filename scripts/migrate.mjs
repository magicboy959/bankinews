import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const sqlDir = new URL("../sql/", import.meta.url);
const files = await fs.readdir(sqlDir);
const migrationFiles = files.filter((file) => file.endsWith(".sql")).sort();
const migrationTableName = "schema_migrations";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  multipleStatements: true,
});

async function ensureMigrationTable() {
  await connection.query(
    `CREATE TABLE IF NOT EXISTS ${migrationTableName} (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      file_name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
}

async function getAppliedMigrationSet() {
  const [rows] = await connection.query(
    `SELECT file_name AS fileName
     FROM ${migrationTableName}
     ORDER BY id ASC`
  );

  return new Set(rows.map((row) => String(row.fileName)));
}

async function getExistingTableCount() {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS tableCount
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME <> ?`,
    [migrationTableName]
  );

  return Number(rows[0]?.tableCount ?? 0);
}

async function baselineExistingDatabase(filesToMark) {
  for (const file of filesToMark) {
    await connection.execute(
      `INSERT IGNORE INTO ${migrationTableName} (file_name)
       VALUES (?)`,
      [file]
    );
  }
}

try {
  await ensureMigrationTable();

  let appliedMigrations = await getAppliedMigrationSet();
  if (appliedMigrations.size === 0) {
    const existingTableCount = await getExistingTableCount();
    if (existingTableCount > 0) {
      await baselineExistingDatabase(migrationFiles);
      appliedMigrations = await getAppliedMigrationSet();
      console.log(`Migration baseline recorded for ${appliedMigrations.size} existing files.`);
    }
  }

  for (const file of migrationFiles) {
    if (appliedMigrations.has(file)) {
      console.log(`Migration skipped: sql/${file}`);
      continue;
    }

    const sql = await fs.readFile(new URL(`../sql/${file}`, import.meta.url), "utf8");
    await connection.query(sql);
    await connection.execute(
      `INSERT INTO ${migrationTableName} (file_name)
       VALUES (?)`,
      [file]
    );
    console.log(`Migration applied: sql/${file}`);
  }
} finally {
  await connection.end();
}
