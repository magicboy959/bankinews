import { createHmac } from "node:crypto";

function getSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is required for marketing campaign tracking");
  }
  return secret;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type MarketingCampaignRecipient = {
  id: number;
  email: string;
};

export function buildMarketingCampaignTrackingToken(campaignId: number, subscriberId: number, email: string) {
  return createHmac("sha256", getSecret()).update(`${campaignId}:${subscriberId}:${normalizeEmail(email)}`).digest("hex");
}

export function verifyMarketingCampaignTrackingToken(
  campaignId: number,
  subscriberId: number,
  email: string,
  token: string
) {
  if (!token) {
    return false;
  }

  const expected = buildMarketingCampaignTrackingToken(campaignId, subscriberId, email);
  return expected.length === token.length && expected === token;
}

export function buildMarketingCampaignOpenPixelUrl(campaignId: number, subscriber: MarketingCampaignRecipient) {
  const token = buildMarketingCampaignTrackingToken(campaignId, subscriber.id, subscriber.email);
  return `/api/marketing-campaigns/open?campaignId=${campaignId}&subscriberId=${subscriber.id}&email=${encodeURIComponent(subscriber.email)}&token=${token}`;
}

export function buildMarketingCampaignClickUrl(campaignId: number, subscriber: MarketingCampaignRecipient, targetUrl: string) {
  const token = buildMarketingCampaignTrackingToken(campaignId, subscriber.id, subscriber.email);
  return `/api/marketing-campaigns/click?campaignId=${campaignId}&subscriberId=${subscriber.id}&email=${encodeURIComponent(subscriber.email)}&token=${token}&url=${encodeURIComponent(targetUrl)}`;
}

export function appendMarketingCampaignTrackingHtml(
  html: string,
  campaignId: number,
  subscriber: MarketingCampaignRecipient
) {
  const clickUrlFor = (targetUrl: string) => buildMarketingCampaignClickUrl(campaignId, subscriber, targetUrl);
  const rewrittenLinks = html.replace(/<a\b([^>]*?)href=("([^"]+)"|'([^']+)')/gi, (match, attrs, _quoted, doubleQuotedUrl, singleQuotedUrl) => {
    const targetUrl = String(doubleQuotedUrl ?? singleQuotedUrl ?? "").trim();
    if (!targetUrl || targetUrl.startsWith("#") || targetUrl.startsWith("mailto:") || targetUrl.startsWith("tel:")) {
      return match;
    }

    return `<a${attrs}href="${clickUrlFor(targetUrl)}"`;
  });

  const openPixelUrl = buildMarketingCampaignOpenPixelUrl(campaignId, subscriber);
  const trackingPixel = `<img src="${openPixelUrl}" width="1" height="1" alt="" style="display:none!important;opacity:0;width:1px;height:1px;overflow:hidden;" />`;

  if (rewrittenLinks.includes("</body>")) {
    return rewrittenLinks.replace("</body>", `${trackingPixel}</body>`);
  }

  return `${rewrittenLinks}${trackingPixel}`;
}
