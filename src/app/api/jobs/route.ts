import { dbExecute, dbQuery } from "@/lib/db/query";
import { badRequest, created, forbidden, ok, serverError } from "@/lib/http";
import { jobSchema } from "@/lib/validation/schemas";
import { requireRole } from "@/lib/auth/guard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "ar";

  try {
    await dbExecute(`UPDATE jobs SET status = 'expired' WHERE application_deadline < CURDATE() AND status <> 'expired'`);

    const rows = await dbQuery<any[]>(
      `SELECT j.id, j.slug, j.organization, j.location, j.employment_type AS employmentType,
              j.application_deadline AS applicationDeadline, j.official_application_url AS officialApplicationUrl,
              j.status, jt.title, jt.description
       FROM jobs j
       JOIN job_translations jt ON jt.job_id = j.id AND jt.locale = ?
       WHERE j.deleted_at IS NULL
       ORDER BY j.application_deadline ASC`,
      [locale]
    );

    return ok(rows);
  } catch {
    return serverError("Unable to fetch jobs");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const parsed = jobSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid job payload", parsed.error.flatten());
    }

    await dbExecute(
      `INSERT INTO jobs
       (slug, organization, location, employment_type, application_deadline, official_application_url, status, verification_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'published', 'verified', NOW(), NOW())`,
      [
        parsed.data.slug,
        parsed.data.organization,
        parsed.data.location,
        parsed.data.employmentType,
        parsed.data.applicationDeadline,
        parsed.data.officialApplicationUrl,
      ]
    );

    const createdJob = await dbQuery<any[]>(`SELECT id FROM jobs WHERE slug = ? LIMIT 1`, [parsed.data.slug]);

    await dbExecute(
      `INSERT INTO job_translations (job_id, locale, title, description, created_at, updated_at)
       VALUES (?, 'ar', ?, ?, NOW(), NOW()), (?, 'en', ?, ?, NOW(), NOW())`,
      [
        createdJob[0]?.id,
        parsed.data.title,
        parsed.data.description,
        createdJob[0]?.id,
        parsed.data.title,
        parsed.data.description,
      ]
    );

    return created({ id: createdJob[0]?.id });
  } catch {
    return serverError("Unable to create job");
  }
}
