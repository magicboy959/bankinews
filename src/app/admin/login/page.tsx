import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getSessionUser } from "@/lib/auth/session";
import { canAccessAdmin, getAdminLandingPath } from "@/lib/auth/permissions";

export default async function AdminLoginPage() {
  const user = await getSessionUser();

  if (user && canAccessAdmin(user.role)) {
    redirect(getAdminLandingPath(user.role));
  }

  return <AdminLoginForm />;
}
