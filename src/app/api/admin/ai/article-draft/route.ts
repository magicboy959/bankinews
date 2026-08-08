import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

type GenerateRequest = {
  prompt?: unknown;
  locale?: unknown;
  mode?: unknown;
  provider?: unknown;
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

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isLocale(value: string): value is "ar" | "en" {
  return value === "ar" || value === "en";
}

function isAiProvider(value: string): value is "openai" | "google" {
  return value === "openai" || value === "google";
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
    const providerValue = cleanText(body.provider) || "openai";
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

    if (!isAiProvider(providerValue)) {
      return badRequest("provider must be 'openai' or 'google'");
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

    if (providerValue === "google") {
      const apiKey = process.env.GOOGLE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) {
        return badRequest("Google AI writing is not configured. Set GOOGLE_AI_API_KEY first.");
      }

      const model = process.env.GOOGLE_AI_TEXT_MODEL?.trim() || "gemini-3.5-flash";
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

      if (!response.ok) {
        return serverError("Google AI request failed");
      }

      const json = (await response.json().catch(() => ({}))) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string | null }> } }>;
      };
      content = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
    } else {
      const apiKey = process.env.OPENAI_API_KEY?.trim();
      if (!apiKey) {
        return badRequest("AI writing is not configured. Set OPENAI_API_KEY first.");
      }

      const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        return serverError("AI request failed");
      }

      const json = (await response.json().catch(() => ({}))) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      content = json.choices?.[0]?.message?.content?.trim() ?? "";
    }

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
