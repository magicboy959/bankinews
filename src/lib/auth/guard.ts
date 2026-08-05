import { getSessionUser } from "@/lib/auth/session";
import { hasMinimumRole } from "@/lib/auth/permissions";
import type { SessionUser } from "@/types";

export async function requireRole(role: SessionUser["role"]) {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, role)) {
    return null;
  }
  return user;
}
