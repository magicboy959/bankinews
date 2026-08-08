import { dbExecute, dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

type HomepageSectionRow = DbRow & {
  id: number;
  sectionKey: string;
  enabled: number | boolean;
  sortOrder: number;
  configJson: unknown;
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

async function writeHomepageSectionAuditLog(userId: number, action: string, sectionId: string) {
  try {
    await dbExecute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, 'homepage_section', ?, NOW())`,
      [userId, action, Number(sectionId)]
    );
  } catch (error) {
    console.error(`${action}_audit_failed`, error);
  }
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
    const rows = await dbQuery<HomepageSectionRow[]>(
      `SELECT id, section_key AS sectionKey, enabled, sort_order AS sortOrder, config_json AS configJson
       FROM homepage_sections
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return notFound("Homepage section not found");
    }

    return ok({
      ...rows[0],
      configJson: normalizeDbJson(rows[0].configJson),
    });
  } catch {
    return serverError("Unable to fetch homepage section");
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
    const body = (await request.json()) as {
      sectionKey?: unknown;
      enabled?: unknown;
      sortOrder?: unknown;
      configJson?: unknown;
    };

    const sectionKey = typeof body.sectionKey === "string" ? body.sectionKey.trim() : "";
    if (!sectionKey) {
      return badRequest("sectionKey is required");
    }

    const enabled = body.enabled === false || body.enabled === 0 ? 0 : 1;
    const sortOrder = typeof body.sortOrder === "number" ? Math.trunc(body.sortOrder) : 0;
    const configJson = parseJsonInput(body.configJson);

    const updated = await dbTransaction(async ({ execute }) => {
      const updateResult = await execute(
        `UPDATE homepage_sections
         SET section_key = ?, enabled = ?, sort_order = ?, config_json = CAST(? AS JSON), updated_by = ?, updated_at = NOW()
         WHERE id = ?`,
        [sectionKey, enabled, sortOrder, JSON.stringify(configJson), user.id, id]
      );

      if (updateResult.affectedRows === 0) {
        return false;
      }

      return true;
    });

    if (!updated) {
      return notFound("Homepage section not found");
    }

    await writeHomepageSectionAuditLog(user.id, "homepage_section_updated", id);

    return ok({ id: Number(id) });
  } catch {
    return serverError("Unable to update homepage section");
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
      const deleteResult = await execute(`DELETE FROM homepage_sections WHERE id = ?`, [id]);

      if (deleteResult.affectedRows === 0) {
        return false;
      }

      return true;
    });

    if (!deleted) {
      return notFound("Homepage section not found");
    }

    await writeHomepageSectionAuditLog(user.id, "homepage_section_deleted", id);

    return ok({ id: Number(id), deleted: true });
  } catch {
    return serverError("Unable to delete homepage section");
  }
}
