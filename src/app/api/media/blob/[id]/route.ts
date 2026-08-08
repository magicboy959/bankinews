import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, notFound, serverError } from "@/lib/http";

type MediaBlobRow = DbRow & {
  id: number;
  mimeType: string;
  fileSize: number;
  fileData: Buffer;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return badRequest("Invalid media id");
  }

  try {
    const rows = await dbQuery<MediaBlobRow[]>(
      `SELECT id, mime_type AS mimeType, file_size AS fileSize, file_data AS fileData
       FROM media_blob_files
       WHERE id = ?
       LIMIT 1`,
      [numericId]
    );

    if (!rows.length) {
      return notFound("Media file not found");
    }

    const row = rows[0];
    const data = row.fileData;

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": row.mimeType || "application/octet-stream",
        "Content-Length": String(row.fileSize || data.length || 0),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return serverError("Unable to load media file");
  }
}
