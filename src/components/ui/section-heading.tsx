export function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-4 border-b border-slate-200 pb-2">
      <h2 className="text-xl font-black tracking-tight text-[#0A2342]">{title}</h2>
    </div>
  );
}
