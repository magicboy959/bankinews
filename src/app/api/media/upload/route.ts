import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { Client } from "basic-ftp";
import { dbExecute, dbInsert, dbQuery } from "@/lib/db/query";
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

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function getFileExtension(fileName: string, mimeType: string): string {
  const fromName = path.extname(fileName || "").toLowerCase();
  if (fromName && /^[.]([a-z0-9]{2,8})$/.test(fromName)) {
    return fromName;
  }

  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  if (mimeType === "image/svg+xml") return ".svg";
  return ".jpg";
}

async function uploadToLocalDisk(file: File) {
  const uploadsRoot = path.join(process.cwd(), "public", "uploads", "media");
  const publicBaseUrl = process.env.MEDIA_LOCAL_PUBLIC_BASE_URL?.trim() || "/uploads/media";
  const now = Date.now();
  const safeBaseName = sanitizeFileName(path.parse(file.name || `image-${now}`).name) || `image-${now}`;
  const extension = getFileExtension(file.name, file.type);
  const fileName = `${safeBaseName}-${now}${extension}`;
  const targetPath = path.join(uploadsRoot, fileName);
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadsRoot, { recursive: true });
  await writeFile(targetPath, fileBuffer);

  const normalizedBase = publicBaseUrl.endsWith("/") ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
  const url = `${normalizedBase}/${fileName}`;

  return {
    fileName,
    url,
    mimeType: file.type || "image/jpeg",
    fileSize: Number(file.size || fileBuffer.length || 0),
    width: null,
    height: null,
  };
}

async function uploadToCloudinary(file: File) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "bankinews/admin";

  if (!cloudName || !apiKey || !apiSecret) {
    return { ok: false as const, error: badRequest("Cloudinary credentials are not configured.") };
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
    return { ok: false as const, error: badRequest("Image upload failed", { details }) };
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
    return { ok: false as const, error: serverError("Cloudinary did not return an image URL") };
  }

  return {
    ok: true as const,
    value: {
      fileName: `${uploadJson.original_filename ?? `image-${Date.now()}`}.${uploadJson.format ?? "jpg"}`,
      url: uploadedUrl,
      mimeType: file.type || "image/jpeg",
      fileSize: Number(uploadJson.bytes ?? file.size ?? 0),
      width: uploadJson.width ? Number(uploadJson.width) : null,
      height: uploadJson.height ? Number(uploadJson.height) : null,
    },
  };
}

async function uploadToCpanelFtp(file: File) {
  const host = process.env.MEDIA_FTP_HOST?.trim();
  const user = process.env.MEDIA_FTP_USER?.trim();
  const password = process.env.MEDIA_FTP_PASSWORD?.trim();
  const publicBaseUrl = process.env.MEDIA_FTP_PUBLIC_BASE_URL?.trim();
  const baseDir = process.env.MEDIA_FTP_BASE_DIR?.trim() || "public_html/uploads/media";
  const secure = (process.env.MEDIA_FTP_SECURE ?? "true").trim().toLowerCase() === "true";
  const port = Number(process.env.MEDIA_FTP_PORT ?? (secure ? 21 : 21));

  if (!host || !user || !password || !publicBaseUrl) {
    return {
      ok: false as const,
      error: badRequest(
        "FTP storage is not configured. Required: MEDIA_FTP_HOST, MEDIA_FTP_USER, MEDIA_FTP_PASSWORD, MEDIA_FTP_PUBLIC_BASE_URL"
      ),
    };
  }

  const now = Date.now();
  const safeBaseName = sanitizeFileName(path.parse(file.name || `image-${now}`).name) || `image-${now}`;
  const extension = getFileExtension(file.name, file.type);
  const fileName = `${safeBaseName}-${now}${extension}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const client = new Client(15_000);
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
    await client.uploadFrom(Readable.from(fileBuffer), fileName);
    client.close();

    const normalizedBase = publicBaseUrl.endsWith("/") ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
    return {
      ok: true as const,
      value: {
        fileName,
        url: `${normalizedBase}/${fileName}`,
        mimeType: file.type || "image/jpeg",
        fileSize: Number(file.size || fileBuffer.length || 0),
        width: null,
        height: null,
      },
    };
  } catch {
    client.close();
    return {
      ok: false as const,
      error: serverError("FTP upload failed. Check MEDIA_FTP_* values and cPanel folder permissions."),
    };
  }
}

async function uploadToDatabaseBlob(file: File) {
  const now = Date.now();
  const safeBaseName = sanitizeFileName(path.parse(file.name || `image-${now}`).name) || `image-${now}`;
  const extension = getFileExtension(file.name, file.type);
  const fileName = `${safeBaseName}-${now}${extension}`;
  const mimeType = file.type || "image/jpeg";
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const fileSize = Number(file.size || fileBuffer.length || 0);
  const maxBytes = Number(process.env.MEDIA_DB_FALLBACK_MAX_BYTES ?? 8 * 1024 * 1024);

  if (Number.isFinite(maxBytes) && maxBytes > 0 && fileSize > maxBytes) {
    return {
      ok: false as const,
      error: badRequest(`Image exceeds DB fallback max size (${maxBytes} bytes).`),
    };
  }

  const blobId = await dbInsert(
    `INSERT INTO media_blob_files
     (file_name, mime_type, file_size, file_data, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [fileName, mimeType, fileSize, fileBuffer]
  );

  return {
    ok: true as const,
    value: {
      fileName,
      url: `/api/media/blob/${blobId}`,
      mimeType,
      fileSize,
      width: null,
      height: null,
    },
  };
}

export async function POST(request: Request) {
  const user = await requireRole("author");
  if (!user) {
    return forbidden();
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

    const driver = (process.env.MEDIA_STORAGE_DRIVER ?? "local").trim().toLowerCase();
    let resolvedDriver = driver;
    let uploaded;

    if (driver === "cloudinary") {
      uploaded = await uploadToCloudinary(file);
    } else if (driver === "cpanel_ftp") {
      uploaded = await uploadToCpanelFtp(file);
    } else if (process.env.VERCEL === "1") {
      // Local disk writes are not durable/reliable on Vercel serverless runtime.
      uploaded = await uploadToDatabaseBlob(file);
      if (uploaded.ok) {
        resolvedDriver = "database_blob_fallback";
      }
    } else {
      uploaded = {
        ok: true as const,
        value: await uploadToLocalDisk(file),
      };
    }

    if (!uploaded.ok && driver === "cpanel_ftp") {
      const shouldFallbackToDb = (process.env.MEDIA_DB_FALLBACK_ON_FAILURE ?? "true").trim().toLowerCase() === "true";
      if (shouldFallbackToDb) {
        uploaded = await uploadToDatabaseBlob(file);
        if (uploaded.ok) {
          resolvedDriver = "database_blob_fallback";
        }
      }
    }

    if (!uploaded.ok) {
      return uploaded.error;
    }

    await dbExecute(
      `INSERT INTO media
       (file_name, url, mime_type, file_size, width, height, alt_text, caption, credit, source_url, uploaded_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        uploaded.value.fileName,
        uploaded.value.url,
        uploaded.value.mimeType,
        uploaded.value.fileSize,
        uploaded.value.width,
        uploaded.value.height,
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

    return created({ uploaded: true, media: rows[0] ?? null, url: uploaded.value.url, driver: resolvedDriver });
  } catch {
    return serverError("Unable to upload image");
  }
}
