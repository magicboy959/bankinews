type Props = {
  html: string;
};

export function ArticleContent({ html }: Props) {
  return (
    <div
      className="prose prose-slate max-w-none prose-headings:font-extrabold prose-a:text-[#005F73]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
