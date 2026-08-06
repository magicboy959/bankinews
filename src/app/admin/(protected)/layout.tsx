import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireAdminUser } from "@/lib/auth/guard";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}