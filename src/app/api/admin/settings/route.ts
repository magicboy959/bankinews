import { dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, created, forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

type SettingRow = DbRow & {
  id: number;
  settingKey: string;
  settingValue: unknown;
  updatedAt: string;
};

function parseJsonInput(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    return JSON.parse(trimmed);
  }

  if (typeof value === "object") {
    return value;
  }

  return value;
}

function normalizeDbJson(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

export async function GET() {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const rows = await dbQuery<SettingRow[]>(
      `SELECT id, setting_key AS settingKey, setting_value AS settingValue, updated_at AS updatedAt
       FROM settings
       ORDER BY updated_at DESC
       LIMIT 200`
    );

    return ok(
      rows.map((row) => ({
        ...row,
        settingValue: normalizeDbJson(row.settingValue),
      }))
    );
  } catch {
    return serverError("Unable to fetch settings");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = (await request.json()) as { settingKey?: unknown; settingValue?: unknown };
    const settingKey = typeof body.settingKey === "string" ? body.settingKey.trim() : "";

    if (!settingKey) {
      return badRequest("settingKey is required");
    }

    const parsedValue = parseJsonInput(body.settingValue);

    const settingId = await dbTransaction(async ({ execute }) => {
      const insertResult = await execute(
        `INSERT INTO settings (setting_key, setting_value, updated_by, created_at, updated_at)
         VALUES (?, CAST(? AS JSON), ?, NOW(), NOW())`,
        [settingKey, JSON.stringify(parsedValue), user.id]
      );

      const createdSettingId = insertResult.insertId;

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'setting_created', 'setting', ?, NOW())`,
        [user.id, createdSettingId]
      );

      return createdSettingId;
    });

    return created({ id: settingId });
  } catch {
    return serverError("Unable to create setting");
  }
}
