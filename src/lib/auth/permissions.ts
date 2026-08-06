import type { SessionUser } from "@/types";

const roleOrder: SessionUser["role"][] = [
  "contributor",
  "author",
  "editor",
  "administrator",
  "super_admin",
];

export const ADMIN_ACCESS_ROLE: SessionUser["role"] = "author";

export function hasMinimumRole(userRole: SessionUser["role"], requiredRole: SessionUser["role"]): boolean {
  return roleOrder.indexOf(userRole) >= roleOrder.indexOf(requiredRole);
}

export function canAccessAdmin(userRole: SessionUser["role"]): boolean {
  return hasMinimumRole(userRole, ADMIN_ACCESS_ROLE);
}

export function getAdminLandingPath(userRole: SessionUser["role"]): string {
  switch (userRole) {
    case "author":
    case "editor":
    case "administrator":
    case "super_admin":
    case "contributor":
    default:
      return "/admin";
  }
}
