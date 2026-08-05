import { dbExecute, dbQuery } from "@/lib/db/query";
import { forbidden, ok, serverError, badRequest, created } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";

export async function GET() {
  const user = await requireRole("administrator");
  if (!user) {
    return forbidden();
  }

  try {
    const users = await dbQuery<any[]>(
      `SELECT id, email, display_name AS displayName, role, is_active AS isActive, created_at AS createdAt
       FROM users
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );
    return ok(users);
  } catch {
    return serverError("Unable to fetch users");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("super_admin");
  if (!user) {
    return forbidden();
  }

  try {
    const body = await request.json();
    if (!body?.email || !body?.name || !body?.password || !body?.role) {
      return badRequest("email, name, password, role are required");
    }

    const passwordHash = await hashPassword(String(body.password));

    await dbExecute(
      `INSERT INTO users (email, display_name, password_hash, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [String(body.email), String(body.name), passwordHash, String(body.role)]
    );

    return created({ created: true });
  } catch {
    return serverError("Unable to create user");
  }
}
