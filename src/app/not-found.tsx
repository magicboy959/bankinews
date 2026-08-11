import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center px-4 py-16 text-center">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005F73]">404 · Banki News</p>
        <h1 className="mt-3 text-3xl font-black text-[var(--foreground)]">الصفحة غير موجودة</h1>
        <p className="mt-3 leading-7 text-[var(--text-muted)]">قد يكون الرابط قد تغير أو أن المحتوى لم يعد متاحاً.</p>
        <Link href="/ar" className="mt-6 inline-flex rounded-md bg-[#0A2342] px-5 py-2.5 font-bold text-white">العودة إلى الرئيسية</Link>
      </div>
    </main>
  );
}
