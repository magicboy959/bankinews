export function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-4 border-b border-[var(--border)] pb-2">
      <h2 className="text-xl font-black tracking-tight text-[var(--foreground)]">{title}</h2>
    </div>
  );
}
