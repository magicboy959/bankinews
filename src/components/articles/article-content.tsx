type Props = {
  html: string;
};

export function ArticleContent({ html }: Props) {
  return (
    <div
      className="prose prose-slate max-w-none break-words overflow-wrap-anywhere text-slate-700 dark:prose-invert dark:text-slate-300 prose-headings:font-extrabold prose-headings:text-[var(--foreground)] prose-a:text-[#005F73] dark:prose-a:text-[#5eead4]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
