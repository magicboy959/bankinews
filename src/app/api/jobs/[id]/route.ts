import { dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { jobSchema } from "@/lib/validation/schemas";

type JobDetailRow = DbRow & {
  id: number;
  slug: string;
  title: string | null;
  organization: string;
  location: string;
  employmentType: string;
  applicationDeadline: string;
  officialApplicationUrl: string;
  description: string | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const rows = await dbQuery<JobDetailRow[]>(
      `SELECT j.id, j.slug, j.organization, j.location,
              j.employment_type AS employmentType,
              j.application_deadline AS applicationDeadline,
              j.official_application_url AS officialApplicationUrl,
              jt.title, jt.description
       FROM jobs j
       LEFT JOIN job_translations jt ON jt.job_id = j.id AND jt.locale = 'ar'
       WHERE j.id = ? AND j.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return notFound("Job not found");
    }

    return ok(rows[0]);
  } catch {
    return serverError("Unable to fetch job");
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = jobSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid job payload", parsed.error.flatten());
    }

    const updated = await dbTransaction(async ({ execute }) => {
      const jobResult = await execute(
        `UPDATE jobs
         SET slug = ?, organization = ?, location = ?, employment_type = ?,
             application_deadline = ?, official_application_url = ?, updated_at = NOW()
         WHERE id = ? AND deleted_at IS NULL`,
        [
          parsed.data.slug,
          parsed.data.organization,
          parsed.data.location,
          parsed.data.employmentType,
          parsed.data.applicationDeadline,
          parsed.data.officialApplicationUrl,
          id,
        ]
      );

      if (jobResult.affectedRows === 0) {
        return false;
      }

      await execute(
        `INSERT INTO job_translations (job_id, locale, title, description, created_at, updated_at)
         VALUES (?, 'ar', ?, ?, NOW(), NOW()), (?, 'en', ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           description = VALUES(description),
           updated_at = NOW()`,
        [
          id,
          parsed.data.title,
          parsed.data.description,
          id,
          parsed.data.title,
          parsed.data.description,
        ]
      );

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'job_updated', 'job', ?, NOW())`,
        [user.id, id]
      );

      return true;
    });

    if (!updated) {
      return notFound("Job not found");
    }

    return ok({ id: Number(id) });
  } catch {
    return serverError("Unable to update job");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("administrator");
  if (!user) {
    return forbidden();
  }

  const { id } = await context.params;

  try {
    const deleted = await dbTransaction(async ({ execute }) => {
      const jobResult = await execute(
        `UPDATE jobs SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );

      if (jobResult.affectedRows === 0) {
        return false;
      }

      await execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
         VALUES (?, 'job_deleted', 'job', ?, NOW())`,
        [user.id, id]
      );

      return true;
    });

    if (!deleted) {
      return notFound("Job not found");
    }

    return ok({ id: Number(id), deleted: true });
  } catch {
    return serverError("Unable to delete job");
  }
}
