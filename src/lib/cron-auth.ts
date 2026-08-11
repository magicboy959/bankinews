import { timingSafeEqual } from "node:crypto";

export function isAuthorizedCronRequest(authorization: string | null, expectedSecret: string | undefined) {
  const expected = expectedSecret?.trim() ?? "";
  const header = authorization?.trim() ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!expected || !provided) return false;

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}
