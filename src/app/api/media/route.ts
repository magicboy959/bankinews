import { badRequest, created, forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { dbExecute, dbQuery } from "@/lib/db/query";

export async function GET() {
  const user = await requireRole("author");
  if (!user) {
    return forbidden();
  }

  try {
    const rows = await dbQuery<any[]>(
      `SELECT id, file_name AS fileName, mime_type AS mimeType, file_size AS fileSize,
              width, height, alt_text AS altText, caption, credit, source_url AS sourceUrl,
              created_at AS createdAt
       FROM media
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 200`
    );
    return ok(rows);
  } catch {
    return serverError("Unable to fetch media");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("author");
  if (!user) {
    return forbidden();
  }

  try {
    const body = await request.json();

    if (!body?.fileName || !body?.url || !body?.mimeType || !body?.fileSize) {
      return badRequest("fileName, url, mimeType, fileSize are required");
    }

    await dbExecute(
      `INSERT INTO media
       (file_name, url, mime_type, file_size, width, height, alt_text, caption, credit, source_url, uploaded_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        String(body.fileName),
        String(body.url),
        String(body.mimeType),
        Number(body.fileSize),
        body.width ? Number(body.width) : null,
        body.height ? Number(body.height) : null,
        body.altText ? String(body.altText) : null,
        body.caption ? String(body.caption) : null,
        body.credit ? String(body.credit) : null,
        body.sourceUrl ? String(body.sourceUrl) : null,
        user.id,
      ]
    );

    return created({ uploaded: true });
  } catch {
    return serverError("Unable to save media metadata");
  }
}

export async function DELETE(request: Request) {
  const user = await requireRole("author");
  if (!user) {
    return forbidden();
  }

  try {
    const { searchParams } = new URL(request.url);
    const idRaw = searchParams.get("id") ?? "";
    const id = Number(idRaw);

    if (!Number.isInteger(id) || id <= 0) {
      return badRequest("A valid media id is required");
    }

    await dbExecute(
      `UPDATE media
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    return ok({ deleted: true, id });
  } catch {
    return serverError("Unable to delete media");
  }
}
