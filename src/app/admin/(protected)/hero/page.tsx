import { HeroAdminManager } from "@/components/admin/hero-admin-manager";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";

type HeroSectionRow = DbRow & {
  id: number;
  sectionKey: string;
  enabled: number | boolean;
  sortOrder: number;
  configJson: unknown;
};

type MediaRow = DbRow & {
  id: number;
  fileName: string;
  url: string;
  createdAt: string;
};

function normalizeDbJson(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export default async function AdminHeroPage() {
  const [heroRows, recentMedia] = await Promise.all([
    dbQuery<HeroSectionRow[]>(
      `SELECT id, section_key AS sectionKey, enabled, sort_order AS sortOrder, config_json AS configJson
       FROM homepage_sections
       WHERE section_key = 'hero_carousel'
       LIMIT 1`
    ),
    dbQuery<MediaRow[]>(
      `SELECT id, file_name AS fileName, url, created_at AS createdAt
       FROM media
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 24`
    ),
  ]);

  const heroSection = heroRows[0]
    ? {
        ...heroRows[0],
        configJson: normalizeDbJson(heroRows[0].configJson),
      }
    : null;

  return <HeroAdminManager heroSection={heroSection} recentMedia={recentMedia} />;
}
