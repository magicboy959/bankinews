import { dbQuery } from "@/lib/db/query";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { badRequest, ok, unauthorized } from "@/lib/http";
import { loginSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid login payload", parsed.error.flatten());
    }

    const users = await dbQuery<any[]>(
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
