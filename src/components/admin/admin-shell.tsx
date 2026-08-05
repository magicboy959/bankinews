import Link from "next/link";

const links = [
  ["Overview", "/admin"],
  ["Articles", "/admin/articles"],
  ["Banks", "/admin/banks"],
  ["Products", "/admin/products"],
  ["Jobs", "/admin/jobs"],
  ["Exchange Rates", "/admin/exchange-rates"],
  ["Settings", "/admin/settings"],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[240px_1fr] md:px-6">
        <aside className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-4 text-lg font-black text-[#0A2342]">BankiNews Admin</p>
          <nav className="space-y-1">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="rounded-xl border border-slate-200 bg-white p-6">{children}</main>
      </div>
    </div>
  );
}
