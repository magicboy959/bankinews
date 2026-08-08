"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CommentStatus = "pending" | "approved" | "rejected" | "spam";
type UiLocale = "en" | "ar";
type DateRange = "all" | "today" | "7d" | "30d";
type StatusFilter = "all" | CommentStatus;

type CommentListItem = {
  id: number;
  articleId: number;
  articleSlug: string;
  articleTitle: string | null;
  name: string;
  email: string;
  comment: string;
  approvalStatus: CommentStatus;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error?: { message?: string };
};

type CommentHistoryItem = {
  action: "comment_moderated" | "comment_deleted" | string;
  previousStatus: string | null;
  newStatus: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  editorName: string | null;
};

const statusOptions: CommentStatus[] = ["pending", "approved", "rejected", "spam"];
const pageSizeOptions = [25, 50, 100] as const;
const defaultPageSize = 50;

const localeText: Record<UiLocale, Record<string, string>> = {
  en: {
    title: "Comments Moderation",
    subtitle: "Review reader comments and set visibility status before they appear publicly.",
    allStatuses: "All statuses",
    dateRange: "Date range",
    allTime: "All time",
    today: "Today",
    last7d: "Last 7d",
    last30d: "Last 30d",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    results: "results",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    spam: "Spam",
    searchPlaceholder: "Search by name, email, article, or comment",
    search: "Search",
    perPage: "Per page",
    resetFilters: "Reset filters",
    exportCsv: "Export CSV",
    exportSelectedCsv: "Export Selected CSV",
    selected: "Selected",
    applyToSelected: "Apply to Selected",
    bulkDeleteSelected: "Delete Selected",
    applying: "Applying...",
    deleting: "Deleting...",
    clear: "Clear",
    selectAll: "Select all comments in current view",
    visibleSet: "Current results",
    showAll: "Show all",
    total: "Total",
    pendingCount: "Pending",
    approvedCount: "Approved",
    rejectedCount: "Rejected",
    spamCount: "Spam",
    selectedCount: "Selected",
    comment: "Comment",
    article: "Article",
    author: "Author",
    status: "Status",
    created: "Created",
    actions: "Actions",
    reports: "Reports",
    history: "History",
    hideHistory: "Hide History",
    moderationHistory: "Moderation History",
    loadingHistory: "Loading history...",
    noHistory: "No moderation actions recorded yet.",
    deleted: "Deleted",
    moderated: "Moderated",
    statusPrefix: "Status",
    by: "By",
    delete: "Delete",
    openArticle: "Open Article",
    noMatches: "No comments match the current filters.",
    chooseLanguage: "Language",
    english: "English",
    arabic: "Arabic",
    updateStatusError: "Unable to update comment status",
    loadHistoryError: "Unable to load moderation history",
    deleteError: "Unable to delete comment",
    bulkUpdateError: "Unable to bulk update comments",
    bulkDeleteError: "Unable to bulk delete comments",
    deleteConfirm: "Delete this comment?",
    bulkDeleteConfirm: "Delete selected comments?",
  },
  ar: {
    title: "إدارة التعليقات",
    subtitle: "راجع تعليقات القراء وحدد حالة الظهور قبل نشرها للعامة.",
    allStatuses: "كل الحالات",
    dateRange: "الفترة الزمنية",
    allTime: "كل الوقت",
    today: "اليوم",
    last7d: "آخر 7 أيام",
    last30d: "آخر 30 يوم",
    previous: "السابق",
    next: "التالي",
    page: "الصفحة",
    of: "من",
    results: "نتيجة",
    pending: "قيد المراجعة",
    approved: "مقبول",
    rejected: "مرفوض",
    spam: "مزعج",
    searchPlaceholder: "ابحث بالاسم أو البريد أو المقال أو نص التعليق",
    search: "بحث",
    perPage: "لكل صفحة",
    resetFilters: "إعادة ضبط الفلاتر",
    exportCsv: "تصدير CSV",
    exportSelectedCsv: "تصدير المحدد CSV",
    selected: "المحدد",
    applyToSelected: "تطبيق على المحدد",
    bulkDeleteSelected: "حذف المحدد",
    applying: "جارٍ التطبيق...",
    deleting: "جارٍ الحذف...",
    clear: "مسح",
    selectAll: "تحديد كل التعليقات في العرض الحالي",
    visibleSet: "نتائج العرض الحالية",
    showAll: "عرض الكل",
    total: "الإجمالي",
    pendingCount: "قيد المراجعة",
    approvedCount: "مقبول",
    rejectedCount: "مرفوض",
    spamCount: "مزعج",
    selectedCount: "المحدد",
    comment: "التعليق",
    article: "المقال",
    author: "الكاتب",
    status: "الحالة",
    created: "تاريخ الإنشاء",
    actions: "الإجراءات",
    reports: "بلاغات",
    history: "السجل",
    hideHistory: "إخفاء السجل",
    moderationHistory: "سجل الإشراف",
    loadingHistory: "جارٍ تحميل السجل...",
    noHistory: "لا توجد إجراءات إشراف مسجلة حتى الآن.",
    deleted: "تم الحذف",
    moderated: "تمت المراجعة",
    statusPrefix: "الحالة",
    by: "بواسطة",
    delete: "حذف",
    openArticle: "فتح المقال",
    noMatches: "لا توجد تعليقات مطابقة للفلاتر الحالية.",
    chooseLanguage: "اللغة",
    english: "الإنجليزية",
    arabic: "العربية",
    updateStatusError: "تعذر تحديث حالة التعليق",
    loadHistoryError: "تعذر تحميل سجل الإشراف",
    deleteError: "تعذر حذف التعليق",
    bulkUpdateError: "تعذر تحديث التعليقات المحددة",
    bulkDeleteError: "تعذر حذف التعليقات المحددة",
    deleteConfirm: "هل تريد حذف هذا التعليق؟",
    bulkDeleteConfirm: "هل تريد حذف التعليقات المحددة؟",
  },
};

export function CommentAdminManager({
  initialRows,
  initialStatusFilter,
  initialDateRange,
  initialQuery,
  page,
  pageSize,
  totalCount,
}: {
  initialRows: CommentListItem[];
  initialStatusFilter: StatusFilter;
  initialDateRange: DateRange;
  initialQuery: string;
  page: number;
  pageSize: number;
  totalCount: number;
}) {
  const router = useRouter();

  const [uiLocale, setUiLocale] = useState<UiLocale>("en");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatusFilter);
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [query, setQuery] = useState(initialQuery);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [bulkStatus, setBulkStatus] = useState<CommentStatus>("approved");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [historyLoadingId, setHistoryLoadingId] = useState<number | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const [historyByComment, setHistoryByComment] = useState<Record<number, CommentHistoryItem[]>>({});
  const [error, setError] = useState<string | null>(null);

  const rows = initialRows;

  const t = localeText[uiLocale];
  const lastSubmittedQueryRef = useRef(initialQuery);

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
    setDateRange(initialDateRange);
    setQuery(initialQuery);
    setCurrentPageSize(pageSize);
    setSelectedIds([]);
    setExpandedHistoryId(null);
    lastSubmittedQueryRef.current = initialQuery;
  }, [initialStatusFilter, initialDateRange, initialQuery, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  function pushFilters(next: {
    status?: StatusFilter;
    range?: DateRange;
    query?: string;
    page?: number;
    pageSize?: number;
  }) {
    const nextStatus = next.status ?? statusFilter;
    const nextRange = next.range ?? dateRange;
    const nextQuery = (next.query ?? query).trim().slice(0, 120);
    const nextPage = Math.max(1, next.page ?? 1);
    const nextPageSize = next.pageSize ?? currentPageSize;

    setStatusFilter(nextStatus);
    setDateRange(nextRange);
    setQuery(nextQuery);
    setCurrentPageSize(nextPageSize);
    setSelectedIds([]);
    setExpandedHistoryId(null);
    lastSubmittedQueryRef.current = nextQuery;

    const params = new URLSearchParams();
    if (nextStatus !== "all") {
      params.set("status", nextStatus);
    }
    if (nextRange !== "all") {
      params.set("range", nextRange);
    }
    if (nextQuery) {
      params.set("q", nextQuery);
    }
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }
    if (nextPageSize !== defaultPageSize) {
      params.set("size", String(nextPageSize));
    }

    const qs = params.toString();
    router.push(qs ? `/admin/comments?${qs}` : "/admin/comments");
  }

  function buildExportHref() {
    const params = new URLSearchParams();
    if (selectedIds.length > 0) {
      params.set("ids", selectedIds.join(","));
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (dateRange !== "all") {
      params.set("range", dateRange);
    }
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    const qs = params.toString();
    return qs ? `/api/admin/comments/export?${qs}` : "/api/admin/comments/export";
  }

  function exportButtonLabel() {
    return selectedIds.length > 0 ? t.exportSelectedCsv : t.exportCsv;
  }

  function resetAllFilters() {
    pushFilters({
      status: "all",
      range: "all",
      query: "",
      page: 1,
      pageSize: defaultPageSize,
    });
  }

  useEffect(() => {
    if (query.trim() === lastSubmittedQueryRef.current.trim()) {
      return;
    }

    const timeout = window.setTimeout(() => {
      pushFilters({ query, page: 1 });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const selectedInViewCount = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)).length,
    [rows, selectedIds]
  );

  const allRowsInViewSelected = rows.length > 0 && selectedInViewCount === rows.length;

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.approvalStatus === "pending") {
          acc.pending += 1;
        } else if (row.approvalStatus === "approved") {
          acc.approved += 1;
        } else if (row.approvalStatus === "rejected") {
          acc.rejected += 1;
        } else if (row.approvalStatus === "spam") {
          acc.spam += 1;
        }
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0, spam: 0 }
    );
  }, [rows]);

  async function parseResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
    const json = (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
    return json;
  }

  async function updateStatus(id: number, status: CommentStatus) {
    setError(null);
    setLoadingId(id);

    const response = await fetch(`/api/admin/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const result = await parseResponse<{ id: number; status: CommentStatus }>(response);
    setLoadingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? t.updateStatusError : result.error?.message ?? t.updateStatusError);
      return;
    }

    router.refresh();
  }

  function toggleSelectOne(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleSelectAllInView() {
    if (allRowsInViewSelected) {
      setSelectedIds((prev) => prev.filter((id) => !rows.some((row) => row.id === id)));
      return;
    }

    setSelectedIds((prev) => {
      const set = new Set(prev);
      for (const row of rows) {
        set.add(row.id);
      }
      return Array.from(set);
    });
  }

  async function applyBulkStatus() {
    if (!selectedIds.length) {
      return;
    }

    setError(null);
    setBulkSubmitting(true);

    const response = await fetch("/api/admin/comments/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, status: bulkStatus }),
    });

    const result = await parseResponse<{ updated: number; status: CommentStatus }>(response);
    setBulkSubmitting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? t.bulkUpdateError : result.error?.message ?? t.bulkUpdateError);
      return;
    }

    setSelectedIds([]);
    router.refresh();
  }

  async function removeSelectedComments() {
    if (!selectedIds.length) {
      return;
    }

    const shouldDelete = window.confirm(t.bulkDeleteConfirm);
    if (!shouldDelete) {
      return;
    }

    setError(null);
    setBulkDeleting(true);

    const response = await fetch("/api/admin/comments/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });

    const result = await parseResponse<{ deleted: number }>(response);
    setBulkDeleting(false);

    if (!response.ok || !result.ok) {
      setError(result.ok ? t.bulkDeleteError : result.error?.message ?? t.bulkDeleteError);
      return;
    }

    setSelectedIds([]);
    router.refresh();
  }

  async function toggleHistory(id: number) {
    if (expandedHistoryId === id) {
      setExpandedHistoryId(null);
      return;
    }

    setExpandedHistoryId(id);
    if (historyByComment[id]) {
      return;
    }

    setError(null);
    setHistoryLoadingId(id);

    const response = await fetch(`/api/admin/comments/${id}/history`, { method: "GET" });
    const result = await parseResponse<CommentHistoryItem[]>(response);
    setHistoryLoadingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? t.loadHistoryError : result.error?.message ?? t.loadHistoryError);
      return;
    }

    setHistoryByComment((prev) => ({ ...prev, [id]: result.data }));
  }

  async function removeComment(id: number) {
    const shouldDelete = window.confirm(t.deleteConfirm);
    if (!shouldDelete) {
      return;
    }

    setError(null);
    setLoadingId(id);

    const response = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    const result = await parseResponse<{ deleted: boolean; id: number }>(response);
    setLoadingId(null);

    if (!response.ok || !result.ok) {
      setError(result.ok ? t.deleteError : result.error?.message ?? t.deleteError);
      return;
    }

    router.refresh();
  }

  function statusBadge(status: CommentStatus) {
    if (status === "approved") {
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    }
    if (status === "rejected") {
      return "bg-rose-500/15 text-rose-700 dark:text-rose-400";
    }
    if (status === "spam") {
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    }
    return "bg-[var(--surface-strong)] text-[var(--text-muted)]";
  }

  function statusLabel(status: string | null): string {
    if (status === "pending") {
      return t.pending;
    }
    if (status === "approved") {
      return t.approved;
    }
    if (status === "rejected") {
      return t.rejected;
    }
    if (status === "spam") {
      return t.spam;
    }
    return status ?? "-";
  }

  function historyLabel(item: CommentHistoryItem): string {
    if (item.action === "comment_deleted") {
      return t.deleted;
    }

    if (item.previousStatus && item.newStatus) {
      return `${t.statusPrefix}: ${statusLabel(item.previousStatus)} -> ${statusLabel(item.newStatus)}`;
    }

    return t.moderated;
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--foreground)]">{t.title}</h1>
      <p className="mt-2 text-[var(--text-muted)]">{t.subtitle}</p>

      <div className="mt-3 flex items-center gap-2">
        <label className="text-xs font-semibold text-[var(--text-muted)]" htmlFor="comments-ui-locale">
          {t.chooseLanguage}
        </label>
        <select
          id="comments-ui-locale"
          value={uiLocale}
          onChange={(event) => setUiLocale(event.target.value as UiLocale)}
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        >
          <option value="en">{t.english}</option>
          <option value="ar">{t.arabic}</option>
        </select>
      </div>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-3 md:grid-cols-[180px_1fr]">
        <select
          value={statusFilter}
          onChange={(event) => pushFilters({ status: event.target.value as StatusFilter, page: 1 })}
          className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
        >
          <option value="all">{t.allStatuses}</option>
          <option value="pending">{t.pending}</option>
          <option value="approved">{t.approved}</option>
          <option value="rejected">{t.rejected}</option>
          <option value="spam">{t.spam}</option>
        </select>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            pushFilters({ query, page: 1 });
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
            placeholder={t.searchPlaceholder}
          />
          <button type="submit" className="rounded border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]">
            {t.search}
          </button>
          <button type="button" onClick={resetAllFilters} className="rounded border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]">
            {t.resetFilters}
          </button>
          <a
            href={buildExportHref()}
            className="rounded border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
          >
            {exportButtonLabel()}
          </a>
        </form>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2">
        <p className="text-xs font-semibold text-[var(--text-muted)]">{t.dateRange}:</p>
        <button
          type="button"
          onClick={() => pushFilters({ range: "all", page: 1 })}
          className={`rounded border px-2 py-1 text-xs font-semibold ${dateRange === "all" ? "border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-400" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface)]"}`}
        >
          {t.allTime}
        </button>
        <button
          type="button"
          onClick={() => pushFilters({ range: "today", page: 1 })}
          className={`rounded border px-2 py-1 text-xs font-semibold ${dateRange === "today" ? "border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-400" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface)]"}`}
        >
          {t.today}
        </button>
        <button
          type="button"
          onClick={() => pushFilters({ range: "7d", page: 1 })}
          className={`rounded border px-2 py-1 text-xs font-semibold ${dateRange === "7d" ? "border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-400" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface)]"}`}
        >
          {t.last7d}
        </button>
        <button
          type="button"
          onClick={() => pushFilters({ range: "30d", page: 1 })}
          className={`rounded border px-2 py-1 text-xs font-semibold ${dateRange === "30d" ? "border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-400" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface)]"}`}
        >
          {t.last30d}
        </button>
      </div>

      <section className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-subtle)]">{t.visibleSet}</p>
          {statusFilter !== "all" && (
            <button
              type="button"
              onClick={() => pushFilters({ status: "all", page: 1 })}
              className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t.showAll}
            </button>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-6">
          <button
            type="button"
            onClick={() => pushFilters({ status: "all", page: 1 })}
            className={`rounded border px-2 py-2 text-left ${statusFilter === "all" ? "border-blue-400/30 bg-blue-500/10" : "border-[var(--border)] bg-[var(--surface-strong)]"}`}
          >
            <p className="text-[11px] font-semibold text-[var(--text-subtle)]">{t.total}</p>
            <p className="text-sm font-bold text-[var(--foreground)]">{summary.total}</p>
          </button>
          <button
            type="button"
            onClick={() => pushFilters({ status: "pending", page: 1 })}
            className={`rounded border px-2 py-2 text-left ${statusFilter === "pending" ? "border-blue-400/30 bg-blue-500/10" : "border-[var(--border)] bg-[var(--surface-strong)]"}`}
          >
            <p className="text-[11px] font-semibold text-[var(--text-subtle)]">{t.pendingCount}</p>
            <p className="text-sm font-bold text-[var(--foreground)]">{summary.pending}</p>
          </button>
          <button
            type="button"
            onClick={() => pushFilters({ status: "approved", page: 1 })}
            className={`rounded border px-2 py-2 text-left ${statusFilter === "approved" ? "border-blue-400/30 bg-blue-500/10" : "border-[var(--border)] bg-[var(--surface-strong)]"}`}
          >
            <p className="text-[11px] font-semibold text-[var(--text-subtle)]">{t.approvedCount}</p>
            <p className="text-sm font-bold text-[var(--foreground)]">{summary.approved}</p>
          </button>
          <button
            type="button"
            onClick={() => pushFilters({ status: "rejected", page: 1 })}
            className={`rounded border px-2 py-2 text-left ${statusFilter === "rejected" ? "border-blue-400/30 bg-blue-500/10" : "border-[var(--border)] bg-[var(--surface-strong)]"}`}
          >
            <p className="text-[11px] font-semibold text-[var(--text-subtle)]">{t.rejectedCount}</p>
            <p className="text-sm font-bold text-[var(--foreground)]">{summary.rejected}</p>
          </button>
          <button
            type="button"
            onClick={() => pushFilters({ status: "spam", page: 1 })}
            className={`rounded border px-2 py-2 text-left ${statusFilter === "spam" ? "border-blue-400/30 bg-blue-500/10" : "border-[var(--border)] bg-[var(--surface-strong)]"}`}
          >
            <p className="text-[11px] font-semibold text-[var(--text-subtle)]">{t.spamCount}</p>
            <p className="text-sm font-bold text-[var(--foreground)]">{summary.spam}</p>
          </button>
          <div className="rounded border border-blue-400/30 bg-blue-500/10 px-2 py-2">
            <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">{t.selectedCount}</p>
            <p className="text-sm font-bold text-blue-900 dark:text-blue-300">{selectedIds.length}</p>
          </div>
        </div>
      </section>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2">
        <p className="text-xs font-semibold text-[var(--text-muted)]">
          {t.selected}: {selectedIds.length}
        </p>
        <select
          value={bulkStatus}
          onChange={(event) => setBulkStatus(event.target.value as CommentStatus)}
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        >
          <option value="pending">{t.pending}</option>
          <option value="approved">{t.approved}</option>
          <option value="rejected">{t.rejected}</option>
          <option value="spam">{t.spam}</option>
        </select>
        <button
          type="button"
          onClick={applyBulkStatus}
          disabled={!selectedIds.length || bulkSubmitting || bulkDeleting}
          className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
        >
          {bulkSubmitting ? t.applying : t.applyToSelected}
        </button>
        <button
          type="button"
          onClick={removeSelectedComments}
          disabled={!selectedIds.length || bulkSubmitting || bulkDeleting}
          className="rounded border border-rose-400/30 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-500/10 disabled:opacity-50"
        >
          {bulkDeleting ? t.deleting : t.bulkDeleteSelected}
        </button>
        <button
          type="button"
          onClick={() => setSelectedIds([])}
          disabled={!selectedIds.length || bulkSubmitting || bulkDeleting}
          className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
        >
          {t.clear}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)]">
        <div className="flex flex-wrap items-center gap-2">
          <p>
            {totalCount} {t.results}
          </p>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--foreground)]">{t.perPage}</span>
            <select
              value={currentPageSize}
              onChange={(event) => pushFilters({ pageSize: Number(event.target.value), page: 1 })}
              className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--foreground)]"
            >
              {pageSizeOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => pushFilters({ page: currentPage - 1 })}
            disabled={currentPage <= 1}
            className="rounded border border-slate-300 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {t.previous}
          </button>
          <p className="font-semibold text-[var(--foreground)]">
            {t.page} {currentPage} {t.of} {totalPages}
          </p>
          <button
            type="button"
            onClick={() => pushFilters({ page: currentPage + 1 })}
            disabled={currentPage >= totalPages}
            className="rounded border border-slate-300 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {t.next}
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--surface-strong)] text-left text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2 font-semibold">
                <input
                  type="checkbox"
                  checked={allRowsInViewSelected}
                  onChange={toggleSelectAllInView}
                  aria-label={t.selectAll}
                />
              </th>
              <th className="px-3 py-2 font-semibold">{t.comment}</th>
              <th className="px-3 py-2 font-semibold">{t.article}</th>
              <th className="px-3 py-2 font-semibold">{t.author}</th>
              <th className="px-3 py-2 font-semibold">{t.status}</th>
              <th className="px-3 py-2 font-semibold">{t.created}</th>
              <th className="px-3 py-2 font-semibold">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={row.id}>
                <tr className="border-t border-[var(--border)] align-top">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleSelectOne(row.id)}
                      aria-label={`Select comment ${row.id}`}
                    />
                  </td>
                  <td className="max-w-[380px] px-3 py-3 text-[var(--foreground)]">
                    <p className="line-clamp-4 whitespace-pre-wrap">{row.comment}</p>
                    {row.reportCount > 0 && (
                      <p className="mt-1 text-xs font-semibold text-amber-700">{t.reports}: {row.reportCount}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    <p className="font-semibold">{row.articleTitle ?? row.articleSlug}</p>
                    <p className="text-xs text-[var(--text-subtle)]">/{row.articleSlug}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-xs text-[var(--text-subtle)]">{row.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(row.approvalStatus)}`}>
                      {statusLabel(row.approvalStatus)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-[var(--text-subtle)]">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] disabled:opacity-50"
                          disabled={loadingId === row.id || row.approvalStatus === status}
                          onClick={() => updateStatus(row.id, status)}
                        >
                          {statusLabel(status)}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        disabled={historyLoadingId === row.id}
                        onClick={() => toggleHistory(row.id)}
                      >
                        {expandedHistoryId === row.id ? t.hideHistory : t.history}
                      </button>
                      <button
                        type="button"
                        className="rounded border border-rose-400/30 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-500/10 disabled:opacity-50"
                        disabled={loadingId === row.id}
                        onClick={() => removeComment(row.id)}
                      >
                        {t.delete}
                      </button>
                      <Link
                        href={`/ar/news/${row.articleSlug}`}
                        target="_blank"
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {t.openArticle}
                      </Link>
                    </div>
                  </td>
                </tr>
                {expandedHistoryId === row.id && (
                  <tr className="border-t border-slate-100 bg-slate-50">
                    <td colSpan={7} className="px-3 py-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">{t.moderationHistory}</p>
                      {historyLoadingId === row.id && (
                          <p className="mt-2 text-xs text-slate-500">{t.loadingHistory}</p>
                      )}
                      {historyLoadingId !== row.id && (historyByComment[row.id] ?? []).length === 0 && (
                          <p className="mt-2 text-xs text-slate-500">{t.noHistory}</p>
                      )}
                      {historyLoadingId !== row.id && (historyByComment[row.id] ?? []).length > 0 && (
                        <div className="mt-2 space-y-2">
                          {(historyByComment[row.id] ?? []).map((item, index) => (
                            <div key={`${item.action}-${item.createdAt}-${index}`} className="rounded border border-slate-200 bg-white px-2 py-2">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="font-semibold text-slate-700">{historyLabel(item)}</span>
                                <span className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                              </div>
                              {item.editorName && <p className="mt-1 text-[11px] text-slate-500">{t.by} {item.editorName}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-500">
                  {t.noMatches}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
