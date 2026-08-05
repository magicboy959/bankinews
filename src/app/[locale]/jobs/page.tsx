import { dbQuery } from "@/lib/db/query";
import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function JobsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "ar";

  let jobs: any[] = [];
  try {
    jobs = await dbQuery<any[]>(
      `SELECT j.organization, j.location, j.employment_type AS employmentType,
              j.application_deadline AS applicationDeadline,
              jt.title, jt.description
       FROM jobs j
       JOIN job_translations jt ON jt.job_id = j.id AND jt.locale = ?
       WHERE j.status = 'published' AND j.deleted_at IS NULL
       ORDER BY j.application_deadline ASC`,
      [safeLocale]
    );
  } catch {
    jobs = [];
  }

  return (
    <div className="space-y-4">
      {jobs.map((job, index) => (
        <article key={`${job.title}-${index}`} className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-black text-slate-900">{job.title}</h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{job.organization} • {job.location} • {job.employmentType}</p>
          <p className="mt-2 text-sm text-slate-600">{job.description}</p>
          <p className="mt-3 text-xs text-slate-500">Deadline: {String(job.applicationDeadline).slice(0, 10)}</p>
        </article>
      ))}
    </div>
  );
}
