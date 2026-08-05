import { dbExecute } from "@/lib/db/query";
import { badRequest, created, serverError } from "@/lib/http";
import { newsletterSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid subscription payload", parsed.error.flatten());
    }

    const token = crypto.randomUUID();

    await dbExecute(
      `
      INSERT INTO newsletter_subscribers
      (name, email, preferred_language, consent_at, status, double_opt_in_token, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), 'pending', ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      preferred_language = VALUES(preferred_language),
      consent_at = VALUES(consent_at),
      status = 'pending',
      double_opt_in_token = VALUES(double_opt_in_token),
      updated_at = NOW()
      `,
      [parsed.data.name ?? null, parsed.data.email, parsed.data.preferredLanguage, token]
    );

    return created({ status: "pending", tokenPreview: token.slice(0, 8) });
  } catch {
    return serverError("Unable to subscribe");
  }
}
