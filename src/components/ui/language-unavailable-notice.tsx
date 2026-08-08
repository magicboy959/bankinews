import Link from "next/link";

type LanguageUnavailableNoticeProps = {
  arabicHref: string;
  contextLabel?: string;
};

export function LanguageUnavailableNotice({ arabicHref, contextLabel }: LanguageUnavailableNoticeProps) {
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <h1 className="text-2xl font-black text-slate-900">Arabic Is Our Main Language</h1>
      <p className="mt-3 text-base leading-7 text-slate-700">This content is not available in this language right now.</p>
      <p className="mt-2 text-sm text-slate-600">
        {contextLabel ? `For this ${contextLabel}, please use Arabic for now.` : "Please switch to the Arabic version for full content."}
      </p>
      <Link
        href={arabicHref}
        className="mt-5 inline-flex rounded bg-[#0A2342] px-4 py-2 text-sm font-semibold text-white hover:bg-[#091b35]"
      >
        Open Arabic Version
      </Link>
    </section>
  );
}