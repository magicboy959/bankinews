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

type InteractionImage = {
  data?: string | null;
  mime_type?: string | null;
  mimeType?: string | null;
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

function hasOutputImage(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as { output_image?: InteractionImage | null; outputImage?: InteractionImage | null };
  const outputImage = response.output_image ?? response.outputImage;
  return cleanText(outputImage?.data).length > 100;
}

function hasNestedImage(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    type?: unknown;
    data?: unknown;
    mime_type?: unknown;
    mimeType?: unknown;
    inlineData?: { data?: string | null } | null;
    inline_data?: { data?: string | null } | null;
    image?: unknown;
    content?: unknown;
    parts?: unknown;
    steps?: unknown;
  };
  const type = cleanText(candidate.type);
  const data = cleanText(candidate.data ?? candidate.inlineData?.data ?? candidate.inline_data?.data);
  const mimeType = cleanText(candidate.mime_type ?? candidate.mimeType);

  if ((type === "image" || mimeType.startsWith("image/")) && data.length > 100) {
    return true;
  }

  if (hasNestedImage(candidate.image)) {
    return true;
  }

  for (const nested of [candidate.content, candidate.parts, candidate.steps]) {
    if (Array.isArray(nested) && nested.some(hasNestedImage)) {
      return true;
    }
  }

  return false;
}

function hasDeepImage(value: unknown, depth = 0): boolean {
  if (!value || depth > 8) {
    return false;
  }

  if (hasNestedImage(value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasDeepImage(item, depth + 1));
  }

  if (typeof value !== "object") {
    return false;
  }

  const objectValue = value as Record<string, unknown>;
  const mimeType = cleanText(objectValue.mime_type ?? objectValue.mimeType ?? objectValue.mime);
  const data = cleanText(
    objectValue.data ??
      objectValue.bytesBase64Encoded ??
      objectValue.base64 ??
      objectValue.b64_json ??
      objectValue.imageBytes
  );

  if (data.length > 100 && (mimeType.startsWith("image/") || cleanText(objectValue.type) === "image")) {
    return true;
  }

  return Object.values(objectValue).some((item) => hasDeepImage(item, depth + 1));
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

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getGoogleApiKey(),
      },
      body: JSON.stringify({
        model: status.imageModel,
        input: [{ type: "text", text: "Generate a simple realistic editorial photo of a bank building exterior, no text." }],
        response_format: {
          type: "image",
          mime_type: "image/jpeg",
          aspect_ratio: "16:9",
        },
      }),
    });

    const json = (await response.json().catch(() => ({}))) as {
      output_image?: InteractionImage | null;
      outputImage?: InteractionImage | null;
      candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
    };

    if (!response.ok) {
      const googleMessage = getGoogleErrorMessage(json);
      return serverError(googleMessage ? `Google AI image test failed: ${googleMessage}` : "Google AI image test failed");
    }

    const imagePart = json.candidates?.[0]?.content?.parts?.map(getInlineImage).find(Boolean);
    return ok({ target, model: status.imageModel, receivedImage: hasOutputImage(json) || hasDeepImage(json) || Boolean(imagePart) });
  } catch {
    return serverError("Unable to test Google AI");
  }
}
