import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/layout/brand-mark";
import { destroySession } from "@/lib/auth/session";
import type { SessionUser } from "@/types";

const links = [
  ["Dashboard", "/admin"],
  ["Articles", "/admin/articles"],
  ["Marketing", "/admin/marketing"],
  ["Comments", "/admin/comments"],
  ["Banks", "/admin/banks"],
  ["Products", "/admin/products"],
  ["Jobs", "/admin/jobs"],
  ["Exchange Rates", "/admin/exchange-rates"],
  ["Homepage & Settings", "/admin/settings"],
];

export function AdminShell({ children, user }: { children: React.ReactNode; user: SessionUser }) {
  async function signOut() {
    "use server";

    await destroySession();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[240px_1fr] md:px-6">
        <aside className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
          <BrandMark locale="ar" size="admin" className="mb-4" />
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Admin Workspace</p>
          <div className="mb-4 rounded-lg bg-[var(--surface-strong)] px-3 py-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">{user.name}</p>
            <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">{user.role.replaceAll("_", " ")}</p>
          </div>
          <nav className="space-y-1">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="block rounded-md px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-strong)]">
                {label}
              </Link>
            ))}
          </nav>
          <form action={signOut} className="mt-6">
            <button type="submit" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-strong)]">
              Sign out
            </button>
          </form>
        </aside>
        <main className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_10px_30px_rgba(2,6,23,0.06)]">{children}</main>
      </div>
    </div>
  );
}
