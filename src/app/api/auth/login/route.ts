import { dbQuery } from "@/lib/db/query";
import { createSession } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { verifyPassword } from "@/lib/auth/password";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, forbidden, ok, unauthorized } from "@/lib/http";
import { loginSchema } from "@/lib/validation/schemas";
import type { SessionUser } from "@/types";

type AuthUserRow = DbRow & {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  role: SessionUser["role"];
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid login payload", parsed.error.flatten());
    }

    const users = await dbQuery<AuthUserRow[]>(
      `SELECT id, email, display_name AS name, password_hash AS passwordHash, role
       FROM users
       WHERE email = ? AND is_active = 1 AND deleted_at IS NULL
       LIMIT 1`,
      [parsed.data.email]
    );

    const user = users[0];
    if (!user) {
      return unauthorized("Invalid email or password");
    }

    const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!validPassword) {
      return unauthorized("Invalid email or password");
    }

    if (!canAccessAdmin(user.role)) {
      return forbidden("This account cannot access the admin area");
    }

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch {
    return unauthorized("Unable to login");
  }
}
