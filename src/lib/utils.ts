export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

export function estimateReadingTime(text: string): number {
  const words = text.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function cn(...parts: Array<string | undefined | null | false>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(input: string | Date, locale: string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function toMysqlDateTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 19).replace("T", " ");
}
