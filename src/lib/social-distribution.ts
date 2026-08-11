export const distributionChannels = [
  "website",
  "facebook",
  "instagram",
  "x",
  "telegram",
  "whatsapp_channel",
  "linkedin",
] as const;

export type DistributionChannel = (typeof distributionChannels)[number];

export type SocialPost = {
  channel: DistributionChannel;
  text: string;
};

export type DistributionArticle = {
  title: string;
  summary: string;
  url: string;
  imageUrl: string | null;
};

export type ChannelPublishResult = {
  channel: DistributionChannel;
  status: "published" | "failed" | "manual_required";
  externalId?: string;
  externalUrl?: string;
  error?: string;
};

export type ChannelConnectionResult = {
  channel: DistributionChannel;
  ok: boolean;
  accountLabel?: string;
  error?: string;
};

function configured(value: string | undefined) {
  return Boolean(value?.trim() && value.trim() !== "replace_me");
}

export function formatTelegramPost(text: string, articleUrl: string, limit = 4096) {
  let domain = articleUrl;
  try {
    domain = new URL(articleUrl).origin;
  } catch {
    // Keep the supplied URL as the domain fallback.
  }

  const followLinks = [
    ["Facebook", process.env.NEXT_PUBLIC_FACEBOOK_PROFILE_URL?.trim() || "https://www.facebook.com/banki.news.sd/"],
    ["Instagram", process.env.NEXT_PUBLIC_INSTAGRAM_PROFILE_URL?.trim() || "https://www.instagram.com/bankinews_sd"],
    ["X", process.env.NEXT_PUBLIC_X_PROFILE_URL?.trim() || "https://x.com/BankiNewsSd"],
    ["LinkedIn", process.env.NEXT_PUBLIC_LINKEDIN_PROFILE_URL?.trim() || "https://www.linkedin.com/company/bankinews-sudan/"],
  ];
  const footer = [
    "📰 اقرأ المقال كاملاً على بنكي نيوز:",
    articleUrl,
    "",
    `🌐 الموقع الرسمي: ${domain}`,
    "",
    "تابع بنكي نيوز على منصات التواصل:",
    ...followLinks.map(([label, href]) => `• ${label}: ${href}`),
  ].join("\n");
  const cleanText = text.split("📰 اقرأ المقال كاملاً على بنكي نيوز:")[0].replaceAll(articleUrl, "").trim();
  const available = Math.max(0, limit - footer.length - 2);
  const lead = cleanText.length > available ? `${cleanText.slice(0, Math.max(0, available - 1)).trimEnd()}…` : cleanText;

  return lead ? `${lead}\n\n${footer}` : footer.slice(0, limit);
}

export function formatFacebookPost(text: string, articleUrl: string) {
  let domain = articleUrl;
  try {
    domain = new URL(articleUrl).origin;
  } catch {
    // Keep the supplied URL as the domain fallback.
  }

  const footer = [
    "📰 شاهد المقال كاملاً على بنكي نيوز:",
    articleUrl,
    "",
    `🌐 الموقع الرسمي: ${domain}`,
    "",
    "تابع بنكي نيوز على منصات التواصل:",
    `• Instagram: ${process.env.NEXT_PUBLIC_INSTAGRAM_PROFILE_URL?.trim() || "https://www.instagram.com/bankinews_sd"}`,
    `• X: ${process.env.NEXT_PUBLIC_X_PROFILE_URL?.trim() || "https://x.com/BankiNewsSd"}`,
    `• Telegram: ${process.env.NEXT_PUBLIC_TELEGRAM_PROFILE_URL?.trim() || "https://t.me/bankinews_sd"}`,
    `• LinkedIn: ${process.env.NEXT_PUBLIC_LINKEDIN_PROFILE_URL?.trim() || "https://www.linkedin.com/company/bankinews-sudan/"}`,
  ].join("\n");
  const cleanText = text.split("📰 شاهد المقال كاملاً على بنكي نيوز:")[0].replaceAll(articleUrl, "").trim();

  return cleanText ? `${cleanText}\n\n${footer}` : footer;
}

export function getDistributionChannelStatus() {
  return {
    website: { configured: true, mode: "automatic" as const },
    facebook: {
      configured: configured(process.env.META_PAGE_ID) && configured(process.env.META_PAGE_ACCESS_TOKEN),
      mode: "automatic" as const,
      profileUrl: process.env.NEXT_PUBLIC_FACEBOOK_PROFILE_URL?.trim() || "https://www.facebook.com/banki.news.sd/",
    },
    instagram: {
      configured: configured(process.env.INSTAGRAM_USER_ID) && configured(process.env.INSTAGRAM_ACCESS_TOKEN),
      mode: "automatic" as const,
      profileUrl: process.env.NEXT_PUBLIC_INSTAGRAM_PROFILE_URL?.trim() || "https://www.instagram.com/bankinews_sd",
    },
    x: { configured: configured(process.env.X_USER_ACCESS_TOKEN), mode: "automatic" as const, profileUrl: process.env.NEXT_PUBLIC_X_PROFILE_URL?.trim() || "https://x.com/BankiNewsSd" },
    telegram: {
      configured: configured(process.env.TELEGRAM_BOT_TOKEN) && configured(process.env.TELEGRAM_CHANNEL_ID),
      mode: "automatic" as const,
      profileUrl: process.env.NEXT_PUBLIC_TELEGRAM_PROFILE_URL?.trim() || "https://t.me/bankinews_sd",
    },
    whatsapp_channel: { configured: true, mode: "manual" as const },
    linkedin: {
      configured: configured(process.env.LINKEDIN_ACCESS_TOKEN) && configured(process.env.LINKEDIN_ORGANIZATION_ID),
      mode: "automatic" as const,
      profileUrl: process.env.NEXT_PUBLIC_LINKEDIN_PROFILE_URL?.trim() || "https://www.linkedin.com/company/bankinews-sudan/",
    },
  };
}

function metaApiUrl(path: string) {
  const version = process.env.META_GRAPH_API_VERSION?.trim() || "v23.0";
  return `https://graph.facebook.com/${version}/${path.replace(/^\//, "")}`;
}

async function responseError(response: Response) {
  const body = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    description?: string;
    detail?: string;
    title?: string;
    message?: string;
  };
  return body.error?.message || body.description || body.detail || body.message || body.title || `HTTP ${response.status}`;
}

export async function testDistributionChannel(channel: DistributionChannel): Promise<ChannelConnectionResult> {
  if (channel === "website") return { channel, ok: true, accountLabel: "Banki News Website" };
  if (channel === "whatsapp_channel") return { channel, ok: true, accountLabel: "Manual copy/open handoff" };
  if (!getDistributionChannelStatus()[channel].configured) return { channel, ok: false, error: `${channel} credentials are not configured.` };

  try {
    if (channel === "facebook") {
      const response = await fetch(metaApiUrl(`${process.env.META_PAGE_ID!.trim()}?fields=id,name&access_token=${encodeURIComponent(process.env.META_PAGE_ACCESS_TOKEN!.trim())}`));
      if (!response.ok) return { channel, ok: false, error: await responseError(response) };
      const json = (await response.json()) as { name?: string; id?: string };
      return { channel, ok: true, accountLabel: json.name || json.id };
    }
    if (channel === "instagram") {
      const response = await fetch(metaApiUrl(`${process.env.INSTAGRAM_USER_ID!.trim()}?fields=id,username&access_token=${encodeURIComponent(process.env.INSTAGRAM_ACCESS_TOKEN!.trim())}`));
      if (!response.ok) return { channel, ok: false, error: await responseError(response) };
      const json = (await response.json()) as { username?: string; id?: string };
      return { channel, ok: true, accountLabel: json.username ? `@${json.username}` : json.id };
    }
    if (channel === "x") {
      const response = await fetch("https://api.x.com/2/users/me", { headers: { Authorization: `Bearer ${process.env.X_USER_ACCESS_TOKEN!.trim()}` } });
      if (!response.ok) return { channel, ok: false, error: await responseError(response) };
      const json = (await response.json()) as { data?: { username?: string; name?: string } };
      return { channel, ok: true, accountLabel: json.data?.username ? `@${json.data.username}` : json.data?.name };
    }
    if (channel === "telegram") {
      const token = process.env.TELEGRAM_BOT_TOKEN!.trim();
      const response = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(process.env.TELEGRAM_CHANNEL_ID!.trim())}`);
      if (!response.ok) return { channel, ok: false, error: await responseError(response) };
      const json = (await response.json()) as { result?: { title?: string; username?: string } };
      return { channel, ok: true, accountLabel: json.result?.title || (json.result?.username ? `@${json.result.username}` : undefined) };
    }

    const organization = process.env.LINKEDIN_ORGANIZATION_ID!.trim().replace(/^urn:li:organization:/, "");
    const response = await fetch(`https://api.linkedin.com/rest/organizations/${encodeURIComponent(organization)}`, {
      headers: {
        Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN!.trim()}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Linkedin-Version": process.env.LINKEDIN_VERSION?.trim() || "202607",
      },
    });
    if (!response.ok) return { channel, ok: false, error: await responseError(response) };
    const json = (await response.json()) as { localizedName?: string; id?: number };
    return { channel, ok: true, accountLabel: json.localizedName || (json.id ? String(json.id) : organization) };
  } catch (error) {
    return { channel, ok: false, error: error instanceof Error ? error.message : "Connection test failed." };
  }
}

export async function publishToChannel(
  channel: Exclude<DistributionChannel, "website">,
  article: DistributionArticle,
  text: string
): Promise<ChannelPublishResult> {
  try {
    if (channel === "whatsapp_channel") {
      return {
        channel,
        status: "manual_required",
        externalUrl: process.env.WHATSAPP_CHANNEL_URL?.trim() || "https://web.whatsapp.com/",
        error: "WhatsApp does not provide an official API for publishing Channel updates.",
      };
    }

    const status = getDistributionChannelStatus()[channel];
    if (!status.configured) {
      return { channel, status: "failed", error: `${channel} credentials are not configured.` };
    }

    if (channel === "facebook") {
      const body = new URLSearchParams({
        message: formatFacebookPost(text, article.url),
        link: article.url,
        access_token: process.env.META_PAGE_ACCESS_TOKEN!.trim(),
      });
      const response = await fetch(metaApiUrl(`${process.env.META_PAGE_ID!.trim()}/feed`), { method: "POST", body });
      if (!response.ok) return { channel, status: "failed", error: await responseError(response) };
      const json = (await response.json()) as { id?: string };
      return { channel, status: "published", externalId: json.id };
    }

    if (channel === "instagram") {
      if (!article.imageUrl) return { channel, status: "failed", error: "Instagram publishing requires a public article image." };
      const token = process.env.INSTAGRAM_ACCESS_TOKEN!.trim();
      const containerBody = new URLSearchParams({ image_url: article.imageUrl, caption: text, access_token: token });
      const containerResponse = await fetch(metaApiUrl(`${process.env.INSTAGRAM_USER_ID!.trim()}/media`), { method: "POST", body: containerBody });
      if (!containerResponse.ok) return { channel, status: "failed", error: await responseError(containerResponse) };
      const container = (await containerResponse.json()) as { id?: string };
      if (!container.id) return { channel, status: "failed", error: "Instagram did not return a media container ID." };
      const publishBody = new URLSearchParams({ creation_id: container.id, access_token: token });
      const publishResponse = await fetch(metaApiUrl(`${process.env.INSTAGRAM_USER_ID!.trim()}/media_publish`), { method: "POST", body: publishBody });
      if (!publishResponse.ok) return { channel, status: "failed", error: await responseError(publishResponse) };
      const published = (await publishResponse.json()) as { id?: string };
      return { channel, status: "published", externalId: published.id };
    }

    if (channel === "x") {
      const response = await fetch("https://api.x.com/2/tweets", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.X_USER_ACCESS_TOKEN!.trim()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) return { channel, status: "failed", error: await responseError(response) };
      const json = (await response.json()) as { data?: { id?: string } };
      return { channel, status: "published", externalId: json.data?.id, externalUrl: json.data?.id ? `https://x.com/i/web/status/${json.data.id}` : undefined };
    }

    if (channel === "telegram") {
      const token = process.env.TELEGRAM_BOT_TOKEN!.trim();
      const method = article.imageUrl ? "sendPhoto" : "sendMessage";
      const telegramText = formatTelegramPost(text, article.url, article.imageUrl ? 1024 : 4096);
      const payload = article.imageUrl
        ? { chat_id: process.env.TELEGRAM_CHANNEL_ID!.trim(), photo: article.imageUrl, caption: telegramText }
        : { chat_id: process.env.TELEGRAM_CHANNEL_ID!.trim(), text: telegramText };
      const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return { channel, status: "failed", error: await responseError(response) };
      const json = (await response.json()) as { result?: { message_id?: number } };
      return { channel, status: "published", externalId: json.result?.message_id ? String(json.result.message_id) : undefined };
    }

    const organization = process.env.LINKEDIN_ORGANIZATION_ID!.trim().replace(/^urn:li:organization:/, "");
    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN!.trim()}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Linkedin-Version": process.env.LINKEDIN_VERSION?.trim() || "202607",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: `urn:li:organization:${organization}`,
        commentary: text,
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        content: { article: { source: article.url, title: article.title, description: article.summary } },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
    });
    if (!response.ok) return { channel, status: "failed", error: await responseError(response) };
    return { channel, status: "published", externalId: response.headers.get("x-restli-id") ?? undefined };
  } catch (error) {
    return { channel, status: "failed", error: error instanceof Error ? error.message : "Unknown publishing error" };
  }
}
