import { dbQuery } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { JobAdminManager } from "@/components/admin/job-admin-manager";

type JobRow = DbRow & {
  id: number;
  title: string | null;
  organization: string;
  employmentType: string;
  status: string;
  applicationDeadline: string;
};

export default async function AdminJobsPage() {
  const rows = await dbQuery<JobRow[]>(
    `SELECT j.id, j.organization, j.employment_type AS employmentType, j.status,
            j.application_deadline AS applicationDeadline, jt.title
     FROM jobs j
     LEFT JOIN job_translations jt ON jt.job_id = j.id AND jt.locale = 'ar'
     WHERE j.deleted_at IS NULL
     ORDER BY j.application_deadline ASC
     LIMIT 50`
  );

  return <JobAdminManager initialRows={rows} />;
}