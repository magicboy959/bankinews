import { getYouTubeEmbedUrl, looksLikeImageUrl } from "@/lib/media";

type EditorialStatus = "draft" | "review" | "scheduled" | "published" | "archived";

type EditorialWorkflowInput = {
  status: EditorialStatus;
  featuredImageUrl?: string | null;
  videoUrl?: string | null;
  sourceUrl?: string | null;
  publishAt?: string | null;
};

const STRICT_EDITORIAL_STATUSES = new Set<EditorialStatus>(["review", "scheduled", "published"]);

export function validateEditorialWorkflow(input: EditorialWorkflowInput): string | null {
  if (!STRICT_EDITORIAL_STATUSES.has(input.status)) {
    return null;
  }

  if (!input.featuredImageUrl) {
    return "Featured image is required before moving this article beyond draft.";
  }

  if (!looksLikeImageUrl(input.featuredImageUrl)) {
    return "Featured image must be a valid image URL or uploaded media path before moving this article beyond draft.";
  }

  if (!input.sourceUrl) {
    return "Source URL is required before moving this article beyond draft.";
  }

  if (input.videoUrl && !getYouTubeEmbedUrl(input.videoUrl)) {
    return "Video URL must be a supported YouTube link before moving this article beyond draft.";
  }

  if (input.status === "scheduled" && !input.publishAt) {
    return "Scheduled articles require a publication date and time.";
  }

  return null;
}