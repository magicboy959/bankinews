import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/layout/brand-mark";
import { destroySession } from "@/lib/auth/session";
import type { SessionUser } from "@/types";

const links = [
  ["Dashboard", "/admin"],
  ["Articles", "/admin/articles"],
  ["Hero", "/admin/hero"],
  ["Marketing", "/admin/marketing"],
  ["Comments", "/admin/comments"],
  ["Banks", "/admin/banks"],
  ["Products", "/admin/products"],
  ["Jobs", "/admin/jobs"],
  ["Exchange Rates", "/admin/exchange-rates"],
  ["Settings", "/admin/settings"],
];

export function AdminShell({ children, user }: { children: React.ReactNode; user: SessionUser }) {
  async function signOut() {
    "use server";

    await destroySession();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-3 py-4 sm:px-4 md:grid-cols-[240px_1fr] md:gap-6 md:px-6 md:py-6">
        <aside className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 shadow-[0_10px_30px_rgba(2,6,23,0.06)] md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 md:block">
            <BrandMark locale="ar" size="admin" className="md:mb-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)] md:mb-4 md:text-sm">Admin Workspace</p>
          </div>
          <div className="mt-3 rounded-lg bg-[var(--surface-strong)] px-3 py-3 md:mb-4 md:mt-0">
            <p className="text-sm font-semibold text-[var(--foreground)]">{user.name}</p>
            <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">{user.role.replaceAll("_", " ")}</p>
          </div>
          <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto pb-1 md:mx-0 md:mt-0 md:block md:space-y-1 md:overflow-visible md:pb-0">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="block shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-strong)] md:shrink">
                {label}
              </Link>
            ))}
          </nav>
          <form action={signOut} className="mt-3 md:mt-6">
            <button type="submit" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-strong)]">
              Sign out
            </button>
          </form>
        </aside>
        <main className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 shadow-[0_10px_30px_rgba(2,6,23,0.06)] sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
