import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

type BrandMarkProps = {
  locale?: Locale;
  href?: string;
  size?: "full" | "compact" | "admin";
  compact?: boolean;
  className?: string;
};

function BrandContent({ locale = "ar", size = "full" }: { locale?: Locale; size?: "full" | "compact" | "admin" }) {
  const isArabic = locale === "ar";
  const logoClass =
    size === "admin"
      ? "h-auto w-[150px] max-w-full object-contain sm:w-[170px] md:w-[190px] lg:w-[210px]"
      : size === "compact"
        ? "h-auto w-[190px] max-w-full object-contain sm:w-[220px] md:w-[250px] lg:w-[280px]"
        : "h-auto w-[250px] max-w-full object-contain sm:w-[310px] md:w-[390px] lg:w-[470px]";

  return (
    <img
      src="/logo-bankinews.png"
      alt={isArabic ? "بنكي أخبار السودان" : "Banki News Sudan"}
      className={logoClass}
      decoding="async"
      loading="eager"
    />
  );
}

export function BrandMark({ locale = "ar", href, size, compact = false, className }: BrandMarkProps) {
  const resolvedSize = size ?? (compact ? "compact" : "full");
  const content = (
    <div className="inline-flex items-center">
      <BrandContent locale={locale} size={resolvedSize} />
    </div>
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={className} aria-label={locale === "ar" ? "بنكي أخبار السودان" : "Banki News Sudan"}>
      {content}
    </Link>
  );
}
