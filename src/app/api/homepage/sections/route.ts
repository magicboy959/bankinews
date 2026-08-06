import { dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, created, forbidden, ok, serverError } from "@/lib/http";
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

export async function GET() {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const rows = await dbQuery<HomepageSectionRow[]>(
      `SELECT id, section_key AS sectionKey, enabled, sort_order AS sortOrder, config_json AS configJson
       FROM homepage_sections
       ORDER BY sort_order ASC, id ASC`
    );

    return ok(
      rows.map((row) => ({
        ...row,
        configJson: normalizeDbJson(row.configJson),
      }))
    );
  } catch {
    return serverError("Unable to fetch homepage sections");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

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

    const sectionId = await dbTransaction(async ({ execute }) => {
      const insertResult = await execute(
        `INSERT INTO homepage_sections
         (section_key, enabled, sort_order, config_json, updated_by, created_at, updated_at)
         VALUES (?, ?, ?, CAST(? AS JSON), ?, NOW(), NOW())`,
        [sectionKey, enabled, sortOrder, JSON.stringify(configJson), user.id]
      );

      const createdSectionId = insertResult.insertId;

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'homepage_section_created', 'homepage_section', ?, NOW())`,
        [user.id, createdSectionId]
      );

      return createdSectionId;
    });

    return created({ id: sectionId });
  } catch {
    return serverError("Unable to create homepage section");
  }
}
