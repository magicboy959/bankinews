import { badRequest, created, forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { dbExecute, dbQuery } from "@/lib/db/query";
import { Client } from "basic-ftp";

type MediaDeleteRow = {
  id: number;
  fileName: string;
  url: string;
};

async function deleteFromFtp(fileName: string): Promise<string | null> {
  const host = process.env.MEDIA_FTP_HOST?.trim();
  const user = process.env.MEDIA_FTP_USER?.trim();
  const password = process.env.MEDIA_FTP_PASSWORD?.trim();
  const baseDir = process.env.MEDIA_FTP_BASE_DIR?.trim() || "uploads/media";
  const secure = (process.env.MEDIA_FTP_SECURE ?? "false").trim().toLowerCase() === "true";
  const port = Number(process.env.MEDIA_FTP_PORT ?? 21);

  if (!host || !user || !password) {
    return "FTP credentials are missing; storage file was not removed.";
  }

  const client = new Client(10_000);
  client.ftp.verbose = false;

  try {
    await client.access({
      host,
      user,
      password,
      port,
      secure,
      secureOptions: secure ? { rejectUnauthorized: false } : undefined,
    });
    await client.ensureDir(baseDir);
    await client.remove(fileName);
    return null;
  } catch (error) {
    return error instanceof Error ? `FTP file delete failed: ${error.message}` : "FTP file delete failed.";
  } finally {
    client.close();
  }
}

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

    const mediaRows = await dbQuery<MediaDeleteRow[]>(
      `SELECT id, file_name AS fileName, url
       FROM media
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [id]
    );

    const target = mediaRows[0];
    if (!target) {
      return ok({ deleted: false, id, warning: "Media item was already deleted or not found." });
    }

    let storageWarning: string | null = null;
    const blobMatch = target.url.match(/^\/api\/media\/blob\/(\d+)$/);
    if (blobMatch) {
      const blobId = Number(blobMatch[1]);
      if (Number.isInteger(blobId) && blobId > 0) {
        await dbExecute(`DELETE FROM media_blob_files WHERE id = ?`, [blobId]);
      }
    } else {
      const publicBase = (process.env.MEDIA_FTP_PUBLIC_BASE_URL ?? "").trim().replace(/\/$/, "");
      if (publicBase && target.url.startsWith(`${publicBase}/`)) {
        storageWarning = await deleteFromFtp(target.fileName);
      }
    }

    await dbExecute(
      `UPDATE media
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    return ok({ deleted: true, id, warning: storageWarning });
  } catch {
    return serverError("Unable to delete media");
  }
}
