import { dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  const { id } = await context.params;

  try {
    const rows = await dbQuery<SettingRow[]>(
      `SELECT id, setting_key AS settingKey, setting_value AS settingValue, updated_at AS updatedAt
       FROM settings
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return notFound("Setting not found");
    }

    return ok({
      ...rows[0],
      settingValue: normalizeDbJson(rows[0].settingValue),
    });
  } catch {
    return serverError("Unable to fetch setting");
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as { settingKey?: unknown; settingValue?: unknown };
    const settingKey = typeof body.settingKey === "string" ? body.settingKey.trim() : "";

    if (!settingKey) {
      return badRequest("settingKey is required");
    }

    const parsedValue = parseJsonInput(body.settingValue);

    const updated = await dbTransaction(async ({ execute }) => {
      const updateResult = await execute(
        `UPDATE settings
         SET setting_key = ?, setting_value = CAST(? AS JSON), updated_by = ?, updated_at = NOW()
         WHERE id = ?`,
        [settingKey, JSON.stringify(parsedValue), user.id, id]
      );

      if (updateResult.affectedRows === 0) {
        return false;
      }

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'setting_updated', 'setting', ?, NOW())`,
        [user.id, id]
      );

      return true;
    });

    if (!updated) {
      return notFound("Setting not found");
    }

    return ok({ id: Number(id) });
  } catch {
    return serverError("Unable to update setting");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("administrator");
  if (!user) {
    return forbidden();
  }

  const { id } = await context.params;

  try {
    const deleted = await dbTransaction(async ({ execute }) => {
      const deleteResult = await execute(`DELETE FROM settings WHERE id = ?`, [id]);

      if (deleteResult.affectedRows === 0) {
        return false;
      }

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'setting_deleted', 'setting', ?, NOW())`,
        [user.id, id]
      );

      return true;
    });

    if (!deleted) {
      return notFound("Setting not found");
    }

    return ok({ id: Number(id), deleted: true });
  } catch {
    return serverError("Unable to delete setting");
  }
}
