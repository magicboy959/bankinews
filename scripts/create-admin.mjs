import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Admin User";
const role = process.env.ADMIN_ROLE ?? "administrator";
const validRoles = new Set(["author", "editor", "administrator", "super_admin"]);

if (!email || !password) {
  console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variable.");
  process.exit(1);
}

if (!validRoles.has(role)) {
  console.error(`Invalid ADMIN_ROLE: ${role}. Expected one of ${Array.from(validRoles).join(", ")}.`);
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

try {
  await connection.beginTransaction();

  const passwordHash = await bcrypt.hash(password, 12);

  await connection.execute(
    `INSERT INTO users (email, display_name, password_hash, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       display_name = VALUES(display_name),
       password_hash = VALUES(password_hash),
       role = VALUES(role),
       is_active = 1,
       deleted_at = NULL,
       updated_at = NOW()`,
    [email, name, passwordHash, role]
  );

  const [userRows] = await connection.execute(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  const userId = userRows[0]?.id;

  if (!userId) {
    throw new Error("Unable to resolve created admin user id.");
  }

  await connection.execute(
    `INSERT INTO authors (user_id, display_name, bio, created_at, updated_at)
     VALUES (?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       display_name = VALUES(display_name),
       updated_at = NOW()`,
    [userId, name, `Author profile for ${name}.`]
  );

  await connection.commit();
  console.log(`Admin account ready: ${email} (${role})`);
} catch (error) {
  await connection.rollback();
  console.error("Failed to create admin account.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await connection.end();
}