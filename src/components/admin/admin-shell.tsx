import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/layout/brand-mark";
import { destroySession } from "@/lib/auth/session";
import type { SessionUser } from "@/types";

const links = [
  ["Dashboard", "/admin"],
  ["Articles", "/admin/articles"],
  ["Comments", "/admin/comments"],
  ["Banks", "/admin/banks"],
  ["Products", "/admin/products"],
  ["Jobs", "/admin/jobs"],
  ["Exchange Rates", "/admin/exchange-rates"],
  ["Advanced Settings", "/admin/settings"],
];

export function AdminShell({ children, user }: { children: React.ReactNode; user: SessionUser }) {
  async function signOut() {
    "use server";

    await destroySession();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[240px_1fr] md:px-6">
        <aside className="rounded-xl border border-slate-200 bg-white p-4">
          <BrandMark locale="ar" size="admin" className="mb-4" />
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Admin Workspace</p>
          <div className="mb-4 rounded-lg bg-slate-50 px-3 py-3">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">{user.role.replaceAll("_", " ")}</p>
          </div>
          <nav className="space-y-1">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                {label}
              </Link>
            ))}
          </nav>
          <form action={signOut} className="mt-6">
            <button type="submit" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Sign out
            </button>
          </form>
        </aside>
        <main className="rounded-xl border border-slate-200 bg-white p-6">{children}</main>
      </div>
    </div>
  );
}
