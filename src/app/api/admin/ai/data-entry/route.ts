import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { slugify } from "@/lib/utils";

type DataEntryRequest = {
  target?: unknown;
  prompt?: unknown;
};

type Target = "bank" | "product" | "job" | "rate" | "campaign";

type DraftValue = Record<string, unknown>;

const DEFAULT_GOOGLE_TEXT_MODEL = "gemini-3.6-flash";

const targetFields: Record<Target, string[]> = {
  bank: ["slug", "name", "shortDescription", "officialWebsite", "headquarters", "swiftCode"],
  product: ["slug", "category", "name", "description", "officialSourceUrl"],
  job: ["slug", "title", "organization", "location", "employmentType", "applicationDeadline", "description", "officialApplicationUrl"],
  rate: ["currencyName", "currencyCode", "officialBuy", "officialSell", "parallelBuy", "parallelSell", "rateDate", "source", "notes"],
  campaign: ["subject", "htmlContent", "textContent"],
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeGeminiModel(value: string, fallback: string) {
  const model = value.trim().replace(/^models\//, "");
  if (!model) {
    return fallback;
  }

  if (model.startsWith("emini-")) {
    return `g${model}`;
  }

  return model;
}

function isTarget(value: string): value is Target {
  return value === "bank" || value === "product" || value === "job" || value === "rate" || value === "campaign";
}

function getGoogleErrorMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const error = (value as { error?: { message?: unknown } }).error;
  return typeof error?.message === "string" ? error.message.trim() : "";
}

function sanitizeDraft(target: Target, value: unknown) {
  const source = value && typeof value === "object" ? (value as DraftValue) : {};
  const next: DraftValue = {};

  for (const field of targetFields[target]) {
    next[field] = cleanText(source[field]);
  }

  if (target === "rate") {
    next.currencyCode = cleanText(next.currencyCode).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    next.rateDate = /^\d{4}-\d{2}-\d{2}$/.test(cleanText(next.rateDate)) ? cleanText(next.rateDate) : "";

    for (const field of ["officialBuy", "officialSell", "parallelBuy", "parallelSell"]) {
      const normalized = cleanText(next[field]).replace(/,/g, "");
      next[field] = normalized && Number.isFinite(Number(normalized)) ? normalized : "";
    }

    return next;
  }

  if (target === "campaign") {
    return next;
  }

  if (!cleanText(next.slug)) {
    const title = cleanText(next.name) || cleanText(next.title) || cleanText(next.organization);
    next.slug = slugify(title) || `${target}-${Date.now()}`;
  } else {
    next.slug = slugify(cleanText(next.slug));
  }

  if (target === "job" && !/^\d{4}-\d{2}-\d{2}$/.test(cleanText(next.applicationDeadline))) {
    next.applicationDeadline = "";
  }

  return next;
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as DataEntryRequest;
    const targetValue = cleanText(body.target);
    const prompt = cleanText(body.prompt);

    if (!isTarget(targetValue)) {
      return badRequest("target must be 'bank', 'product', 'job', 'rate', or 'campaign'");
    }

    if (prompt.length < 12) {
      return badRequest("Describe the data you want Google AI to enter.");
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === "replace_me") {
      return badRequest("Google AI is not configured. Set GOOGLE_AI_API_KEY to your paid Google API key.");
    }

    const model = normalizeGeminiModel(process.env.GOOGLE_AI_TEXT_MODEL ?? "", DEFAULT_GOOGLE_TEXT_MODEL);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: [
                "You are a careful CMS data-entry assistant for BankiNews.",
                "Use only the provided facts. Do not invent URLs, SWIFT codes, exchange rates, deadlines, or official claims.",
                "Return JSON only. Use empty strings for unknown fields.",
                `Target: ${targetValue}. Required keys: ${targetFields[targetValue].join(", ")}.`,
                "Dates must be YYYY-MM-DD. Slugs must be lowercase ASCII letters, digits, and hyphens.",
                "For campaign htmlContent, return simple semantic HTML using paragraphs, headings, and lists only.",
              ].join(" "),
            },
          ],
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    const json = (await response.json().catch(() => ({}))) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string | null }> } }>;
    };

    if (!response.ok) {
      const googleMessage = getGoogleErrorMessage(json);
      return serverError(googleMessage ? `Google AI data entry failed: ${googleMessage}` : "Google AI data entry failed");
    }

    const content = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
    if (!content) {
      return serverError("Google AI did not return data");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      return serverError("Google AI returned invalid JSON");
    }

    return ok(sanitizeDraft(targetValue, parsed));
  } catch {
    return serverError("Unable to generate data entry draft");
  }
}
