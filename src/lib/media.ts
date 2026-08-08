const IMAGE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

export function getYouTubeEmbedUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) {
    return null;
  }

  const value = rawUrl.trim();
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsed.pathname.replace(/^\//, "").split("/")[0] ?? "";
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v") ?? "";
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/")[2] ?? "";
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/")[2] ?? "";
      }
    }

    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      return null;
    }

    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

export function looksLikeImageUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl) {
    return false;
  }

  const value = rawUrl.trim();
  if (!value) {
    return false;
  }

  if (value.startsWith("/api/media/blob/") || value.startsWith("/uploads/") || value.startsWith("https://media.bankinews.com/")) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return IMAGE_EXTENSION_PATTERN.test(parsed.pathname);
  } catch {
    return false;
  }
}
