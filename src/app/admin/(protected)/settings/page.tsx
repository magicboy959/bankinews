import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { SettingsAdminManager } from "@/components/admin/settings-admin-manager";

type SettingRow = DbRow & {
  id: number;
  settingKey: string;
  settingValue: unknown;
  updatedAt: string;
};

type HomepageSectionRow = DbRow & {
  id: number;
  sectionKey: string;
  enabled: number | boolean;
  sortOrder: number;
  configJson: unknown;
};

function getGoogleAiStatus() {
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim() || "";
  const configured = Boolean(apiKey && apiKey !== "replace_me");

  return {
    configured,
    keyStatus: configured ? "configured" : "missing",
    textModel: process.env.GOOGLE_AI_TEXT_MODEL?.trim() || "gemini-3.6-flash",
    imageModel: process.env.GOOGLE_AI_IMAGE_MODEL?.trim() || "gemini-3.1-flash-image",
  };
}

export default async function AdminSettingsPage() {
  const [settings, sections] = await Promise.all([
    dbQuery<SettingRow[]>(
      `SELECT id, setting_key AS settingKey, setting_value AS settingValue, updated_at AS updatedAt
       FROM settings
       ORDER BY updated_at DESC
       LIMIT 50`
    ),
    dbQuery<HomepageSectionRow[]>(
      `SELECT id, section_key AS sectionKey, enabled, sort_order AS sortOrder, config_json AS configJson
       FROM homepage_sections
       ORDER BY sort_order ASC`
    ),
  ]);

  return <SettingsAdminManager initialSettings={settings} initialSections={sections} googleAiStatus={getGoogleAiStatus()} />;
}
