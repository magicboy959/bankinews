import { getSessionUser } from "@/lib/auth/session";
import { canAccessAdmin, hasMinimumRole } from "@/lib/auth/permissions";
import type { SessionUser } from "@/types";

export async function requireRole(role: SessionUser["role"]) {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, role)) {
    return null;
  }
  return user;
}

export async function requireAdminUser() {
  const user = await getSessionUser();
  if (!user || !canAccessAdmin(user.role)) {
    return null;
  }
  return user;
}
