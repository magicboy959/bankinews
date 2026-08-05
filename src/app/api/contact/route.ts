import { dbExecute } from "@/lib/db/query";
import { badRequest, created, serverError } from "@/lib/http";
import { contactSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid contact payload", parsed.error.flatten());
    }

    await dbExecute(
      `INSERT INTO contact_messages
       (full_name, email, phone, subject, message, consent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        parsed.data.fullName,
        parsed.data.email,
        parsed.data.phone ?? null,
        parsed.data.subject,
        parsed.data.message,
      ]
    );

    return created({ submitted: true });
  } catch {
    return serverError("Unable to submit message");
  }
}
