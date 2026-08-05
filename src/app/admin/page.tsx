import { dbQuery } from "@/lib/db/query";

async function getCount(table: string): Promise<number> {
  try {
    const rows = await dbQuery<any[]>(`SELECT COUNT(*) AS count FROM ${table} WHERE deleted_at IS NULL`);
    return Number(rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

export default async function AdminOverviewPage() {
  const [articles, banks, products, jobs] = await Promise.all([
    getCount("articles"),
    getCount("banks"),
    getCount("products"),
    getCount("jobs"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-black text-[#0A2342]">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 p-4"><p className="text-sm text-slate-500">Articles</p><p className="text-2xl font-black">{articles}</p></div>
        <div className="rounded-lg border border-slate-200 p-4"><p className="text-sm text-slate-500">Banks</p><p className="text-2xl font-black">{banks}</p></div>
        <div className="rounded-lg border border-slate-200 p-4"><p className="text-sm text-slate-500">Products</p><p className="text-2xl font-black">{products}</p></div>
        <div className="rounded-lg border border-slate-200 p-4"><p className="text-sm text-slate-500">Jobs</p><p className="text-2xl font-black">{jobs}</p></div>
      </div>
    </div>
  );
}
