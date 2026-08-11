"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
        <main className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005F73]">Banki News</p>
          <h1 className="mt-3 text-2xl font-black">تعذر تحميل الصفحة</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">حدث خطأ غير متوقع. يمكنك المحاولة مرة أخرى دون فقدان عنوان الصفحة.</p>
          <button type="button" onClick={reset} className="mt-5 rounded-md bg-[#0A2342] px-5 py-2.5 font-bold text-white">إعادة المحاولة</button>
        </main>
      </body>
    </html>
  );
}
