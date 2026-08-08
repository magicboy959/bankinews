export type MarketingTemplateKey =
  | "breaking_news"
  | "daily_digest"
  | "bank_alert"
  | "editorial_newsletter";

export type MarketingTemplate = {
  key: MarketingTemplateKey;
  label: string;
  subject: string;
  htmlContent: string;
  textContent: string;
};

function wrapHtml(title: string, intro: string, bulletItems: string[], outro: string, ctaLabel: string, ctaUrl: string) {
  const bullets = bulletItems.map((item) => `<li style="margin:0 0 8px;">${item}</li>`).join("");

  return `
  <div style="font-family: Arial, Tahoma, sans-serif; line-height:1.8; color:#0f172a; background:#ffffff; padding:24px;">
    <h2 style="margin:0 0 12px; color:#0A2342;">${title}</h2>
    <p>${intro}</p>
    <ul style="padding-left:20px; margin:16px 0;">${bullets}</ul>
    <p>${outro}</p>
    <p style="margin-top:24px;">
      <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#0A2342; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:8px; font-weight:700;">${ctaLabel}</a>
    </p>
  </div>`;
}

function wrapText(title: string, intro: string, bulletItems: string[], outro: string, ctaLabel: string, ctaUrl: string) {
  return [title, "", intro, "", ...bulletItems.map((item) => `- ${item}`), "", outro, "", `${ctaLabel}: ${ctaUrl}`].join("\n");
}

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://bankinews.com").replace(/\/$/, "");

export const marketingTemplates: MarketingTemplate[] = [
  {
    key: "breaking_news",
    label: "Breaking News",
    subject: "Breaking: Latest Banking Update",
    htmlContent: wrapHtml(
      "Breaking Banking Update",
      "We are sharing an important banking update with our readers.",
      [
        "Verified and timely banking news",
        "What changed and why it matters",
        "Official source references",
      ],
      "Read the full report and stay informed with the latest developments.",
      "Read more",
      siteUrl
    ),
    textContent: wrapText(
      "Breaking Banking Update",
      "We are sharing an important banking update with our readers.",
      [
        "Verified and timely banking news",
        "What changed and why it matters",
        "Official source references",
      ],
      "Read the full report and stay informed with the latest developments.",
      "Read more",
      siteUrl
    ),
  },
  {
    key: "daily_digest",
    label: "Daily Digest",
    subject: "Daily Banking Digest",
    htmlContent: wrapHtml(
      "Daily Banking Digest",
      "Here is your daily summary of the most important banking stories.",
      [
        "Top bank updates",
        "Key financial trends",
        "Digital banking and fintech highlights",
      ],
      "Open the website for more detail on each story.",
      "Visit website",
      siteUrl
    ),
    textContent: wrapText(
      "Daily Banking Digest",
      "Here is your daily summary of the most important banking stories.",
      [
        "Top bank updates",
        "Key financial trends",
        "Digital banking and fintech highlights",
      ],
      "Open the website for more detail on each story.",
      "Visit website",
      siteUrl
    ),
  },
  {
    key: "bank_alert",
    label: "Bank Alert",
    subject: "Important Bank Alert",
    htmlContent: wrapHtml(
      "Important Bank Alert",
      "An important banking alert is now available for readers and subscribers.",
      [
        "Service changes and notices",
        "Security and fraud warnings",
        "Action items for customers",
      ],
      "Please review the full alert and confirm details from the official source.",
      "Review alert",
      siteUrl
    ),
    textContent: wrapText(
      "Important Bank Alert",
      "An important banking alert is now available for readers and subscribers.",
      [
        "Service changes and notices",
        "Security and fraud warnings",
        "Action items for customers",
      ],
      "Please review the full alert and confirm details from the official source.",
      "Review alert",
      siteUrl
    ),
  },
  {
    key: "editorial_newsletter",
    label: "Editorial Newsletter",
    subject: "Banki News Editorial Roundup",
    htmlContent: wrapHtml(
      "Editorial Roundup",
      "Our editorial team has curated the most important stories for this edition.",
      [
        "Selected analysis and explainers",
        "Featured banking and fintech coverage",
        "Practical reading for decision-makers",
      ],
      "Visit the website to continue reading and explore more stories.",
      "Open Banki News",
      siteUrl
    ),
    textContent: wrapText(
      "Editorial Roundup",
      "Our editorial team has curated the most important stories for this edition.",
      [
        "Selected analysis and explainers",
        "Featured banking and fintech coverage",
        "Practical reading for decision-makers",
      ],
      "Visit the website to continue reading and explore more stories.",
      "Open Banki News",
      siteUrl
    ),
  },
];

export function getMarketingTemplate(key: MarketingTemplateKey) {
  return marketingTemplates.find((template) => template.key === key) ?? null;
}
