import { createHash } from "node:crypto";
import { dbExecute, dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, created, forbidden, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

type MediaRow = DbRow & {
  id: number;
  fileName: string;
  url: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

function buildSignature(timestamp: number, apiSecret: string, folder: string) {
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  return createHash("sha1").update(toSign).digest("hex");
}

export async function POST(request: Request) {
  const user = await requireRole("author");
  if (!user) {
    return forbidden();
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "bankinews/admin";

  if (!cloudName || !apiKey || !apiSecret) {
    return badRequest("Cloudinary credentials are not configured.");
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const altText = String(form.get("altText") ?? "").trim() || null;
    const caption = String(form.get("caption") ?? "").trim() || null;
    const credit = String(form.get("credit") ?? "").trim() || null;
    const sourceUrl = String(form.get("sourceUrl") ?? "").trim() || null;

    if (!(file instanceof File)) {
      return badRequest("file is required");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = buildSignature(timestamp, apiSecret, folder);

    const cloudinaryForm = new FormData();
    cloudinaryForm.set("file", file);
    cloudinaryForm.set("api_key", apiKey);
    cloudinaryForm.set("timestamp", String(timestamp));
    cloudinaryForm.set("signature", signature);
    cloudinaryForm.set("folder", folder);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: cloudinaryForm,
      }
    );

    if (!uploadResponse.ok) {
      const details = await uploadResponse.text().catch(() => "");
      return badRequest("Image upload failed", { details });
    }

    const uploadJson = (await uploadResponse.json()) as {
      secure_url?: string;
      original_filename?: string;
      format?: string;
      bytes?: number;
      width?: number;
      height?: number;
    };

    const uploadedUrl = String(uploadJson.secure_url ?? "").trim();
    if (!uploadedUrl) {
      return serverError("Cloudinary did not return an image URL");
    }

    const fileName = `${uploadJson.original_filename ?? `image-${Date.now()}`}.${uploadJson.format ?? "jpg"}`;
    const mimeType = file.type || "image/jpeg";
    const fileSize = Number(uploadJson.bytes ?? file.size ?? 0);

    await dbExecute(
      `INSERT INTO media
       (file_name, url, mime_type, file_size, width, height, alt_text, caption, credit, source_url, uploaded_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        fileName,
        uploadedUrl,
        mimeType,
        fileSize,
        uploadJson.width ? Number(uploadJson.width) : null,
        uploadJson.height ? Number(uploadJson.height) : null,
        altText,
        caption,
        credit,
        sourceUrl,
        user.id,
      ]
    );

    const rows = await dbQuery<MediaRow[]>(
      `SELECT id, file_name AS fileName, url, mime_type AS mimeType,
              file_size AS fileSize, width, height, created_at AS createdAt
       FROM media
       ORDER BY id DESC
       LIMIT 1`
    );

    return created({ uploaded: true, media: rows[0] ?? null, url: uploadedUrl });
  } catch {
    return serverError("Unable to upload image");
  }
}
