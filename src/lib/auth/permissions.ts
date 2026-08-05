import type { SessionUser } from "@/types";

const roleOrder: SessionUser["role"][] = [
  "contributor",
  "author",
  "editor",
  "administrator",
  "super_admin",
];

export function hasMinimumRole(userRole: SessionUser["role"], requiredRole: SessionUser["role"]): boolean {
  return roleOrder.indexOf(userRole) >= roleOrder.indexOf(requiredRole);
}
