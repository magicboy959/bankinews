import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

type TestRequest = {
  target?: unknown;
};

type GeminiPart = {
  text?: string | null;
  inlineData?: { mimeType?: string | null; data?: string | null } | null;
  inline_data?: { mime_type?: string | null; data?: string | null } | null;
};

const DEFAULT_GOOGLE_TEXT_MODEL = "gemini-3.5-flash";
const DEFAULT_GOOGLE_IMAGE_MODEL = "gemini-3.1-flash-image";

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

function getGoogleApiKey() {
  return process.env.GOOGLE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim() || "";
}

function getGoogleStatus() {
  const apiKey = getGoogleApiKey();
  const configured = Boolean(apiKey && apiKey !== "replace_me");

  return {
    configured,
    keyStatus: configured ? "configured" : "missing",
    textModel: normalizeGeminiModel(process.env.GOOGLE_AI_TEXT_MODEL ?? "", DEFAULT_GOOGLE_TEXT_MODEL),
    imageModel: normalizeGeminiModel(process.env.GOOGLE_AI_IMAGE_MODEL ?? "", DEFAULT_GOOGLE_IMAGE_MODEL),
  };
}

function getGoogleErrorMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const error = (value as { error?: { message?: unknown } }).error;
  return typeof error?.message === "string" ? error.message.trim() : "";
}

function getInlineImage(part: GeminiPart) {
  if (part.inlineData?.mimeType && part.inlineData.data) {
    return part.inlineData;
  }

  if (part.inline_data?.mime_type && part.inline_data.data) {
    return { mimeType: part.inline_data.mime_type, data: part.inline_data.data };
  }

  return null;
}

export async function GET() {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  return ok(getGoogleStatus());
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  const status = getGoogleStatus();
  if (!status.configured) {
    return badRequest("Google AI is not configured. Set GOOGLE_AI_API_KEY to your paid Google API key.");
  }

  try {
    const body = (await request.json().catch(() => ({}))) as TestRequest;
    const target = cleanText(body.target) || "text";

    if (target !== "text" && target !== "image") {
      return badRequest("target must be 'text' or 'image'");
    }

    if (target === "text") {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(status.textModel)}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": getGoogleApiKey(),
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Return the JSON object {\"ok\":true,\"service\":\"google-ai\"}." }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        }),
      });

      const json = (await response.json().catch(() => ({}))) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string | null }> } }>;
      };

      if (!response.ok) {
        const googleMessage = getGoogleErrorMessage(json);
        return serverError(googleMessage ? `Google AI text test failed: ${googleMessage}` : "Google AI text test failed");
      }

      const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
      return ok({ target, model: status.textModel, receivedContent: Boolean(text) });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(status.imageModel)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getGoogleApiKey(),
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Generate a simple realistic editorial photo of a bank building exterior, no text. Prefer a 16:9 composition." }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    const json = (await response.json().catch(() => ({}))) as {
      candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
    };

    if (!response.ok) {
      const googleMessage = getGoogleErrorMessage(json);
      return serverError(googleMessage ? `Google AI image test failed: ${googleMessage}` : "Google AI image test failed");
    }

    const imagePart = json.candidates?.[0]?.content?.parts?.map(getInlineImage).find(Boolean);
    return ok({ target, model: status.imageModel, receivedImage: Boolean(imagePart) });
  } catch {
    return serverError("Unable to test Google AI");
  }
}
