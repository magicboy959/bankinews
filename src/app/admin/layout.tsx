import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { hasMinimumRole } from "@/lib/auth/permissions";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  if (!user || !hasMinimumRole(user.role, "contributor")) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
