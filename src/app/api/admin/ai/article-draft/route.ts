import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

type GenerateRequest = {
  prompt?: unknown;
  locale?: unknown;
  mode?: unknown;
  articleType?: unknown;
  title?: unknown;
  summary?: unknown;
  contentHtml?: unknown;
};

type DraftResponse = {
  title: string;
  summary: string;
  contentHtml: string;
};

type DualDraftResponse = {
  ar: DraftResponse;
  en: DraftResponse;
};

const DEFAULT_GOOGLE_TEXT_MODEL = "gemini-3.5-flash";

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

function isLocale(value: string): value is "ar" | "en" {
  return value === "ar" || value === "en";
}

function parseDraftResponse(value: unknown): DraftResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const draft = value as Record<string, unknown>;
  const title = cleanText(draft.title);
  const summary = cleanText(draft.summary);
  const contentHtml = cleanText(draft.contentHtml);

  if (!title || !summary || !contentHtml) {
    return null;
  }

  return { title, summary, contentHtml };
}

function parseDualDraftResponse(value: unknown): DualDraftResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const draft = value as Record<string, unknown>;
  const ar = parseDraftResponse(draft.ar);
  const en = parseDraftResponse(draft.en);

  if (!ar || !en) {
    return null;
  }

  return { ar, en };
}

function getGoogleErrorMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const error = (value as { error?: { message?: unknown } }).error;
  return typeof error?.message === "string" ? error.message.trim() : "";
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as GenerateRequest;
    const prompt = cleanText(body.prompt);
    const localeValue = cleanText(body.locale);
    const modeValue = cleanText(body.mode) || "single";
    const articleType = cleanText(body.articleType) || "news";
    const title = cleanText(body.title);
    const summary = cleanText(body.summary);
    const contentHtml = cleanText(body.contentHtml);

    if (prompt.length < 20) {
      return badRequest("Describe the story angle or facts first.");
    }

    if (!isLocale(localeValue)) {
      return badRequest("locale must be 'ar' or 'en'");
    }

    const isDualMode = modeValue === "dual";
    const systemPrompt = isDualMode
      ? [
          "You are a senior newsroom editor for BankiNews, a bilingual Sudanese banking and fintech publication.",
          "Help the editor draft accurate, concise, publication-ready article content in both Arabic and English.",
          "Do not invent facts, names, dates, quotes, numbers, or sources.",
          "Use only the information provided by the editor.",
          "Return JSON only with ar and en objects, each containing title, summary, and contentHtml.",
          "The contentHtml values must be valid HTML using simple paragraphs, headings, and lists only.",
          "Keep the two language versions faithful to each other, but natural in each language.",
        ].join(" ")
      : [
          "You are a senior newsroom editor for BankiNews, a bilingual Sudanese banking and fintech publication.",
          "Help the editor draft accurate, concise, publication-ready article content.",
          "Do not invent facts, names, dates, quotes, numbers, or sources.",
          "Use only the information provided by the editor.",
          "Return JSON only with title, summary, and contentHtml.",
          "The contentHtml value must be valid HTML using simple paragraphs, headings, and lists only.",
          `Write the response in ${localeValue === "ar" ? "Arabic" : "English"}.`,
        ].join(" ");

    const userPrompt = JSON.stringify(
      {
        locale: localeValue,
        mode: modeValue,
        articleType,
        editorPrompt: prompt,
        existingDraft: {
          title: title || null,
          summary: summary || null,
          contentHtml: contentHtml || null,
        },
      },
      null,
      2
    );

    let content = "";

    const apiKey = process.env.GOOGLE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === "replace_me") {
      return badRequest("Google AI writing is not configured. Set GOOGLE_AI_API_KEY to your paid Google API key.");
    }

    const model = normalizeGeminiModel(process.env.GOOGLE_AI_TEXT_MODEL ?? "", DEFAULT_GOOGLE_TEXT_MODEL);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    const json = (await response.json().catch(() => ({}))) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string | null }> } }>;
    };

    if (!response.ok) {
      const googleMessage = getGoogleErrorMessage(json);
      return serverError(googleMessage ? `Google AI request failed: ${googleMessage}` : "Google AI request failed");
    }

    content = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";

    if (!content) {
      return serverError("AI did not return any content");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      return serverError("AI returned invalid JSON");
    }

    if (isDualMode) {
      const draft = parseDualDraftResponse(parsed);
      if (!draft) {
        return serverError("AI response was missing Arabic or English draft content");
      }

      return ok(draft);
    }

    const draft = parseDraftResponse(parsed);
    if (!draft) {
      return serverError("AI response was missing title, summary, or contentHtml");
    }

    return ok(draft);
  } catch {
    return serverError("Unable to generate AI draft");
  }
}
