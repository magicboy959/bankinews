import { cache } from "react";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";

type SettingRow = DbRow & {
  settingValue: unknown;
};

export type SocialLink = {
  label: string;
  href: string;
};

function normalizeDbJson(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return value;
}

export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  try {
    const rows = await dbQuery<SettingRow[]>(
      `SELECT setting_value AS settingValue
       FROM settings
       WHERE setting_key = 'social_links'
       LIMIT 1`
    );

    const normalized = normalizeDbJson(rows[0]?.settingValue);
    const links =
      normalized && typeof normalized === "object" && Array.isArray((normalized as { links?: unknown[] }).links)
        ? (normalized as { links: Array<{ label?: string; href?: string }> }).links
        : Array.isArray(normalized)
          ? (normalized as Array<{ label?: string; href?: string }>)
          : [];

    return links
      .map((item) => ({
        label: item.label?.trim() ?? "",
        href: item.href?.trim() ?? "",
      }))
      .filter((item) => item.label && item.href);
  } catch {
    return [];
  }
});
