import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";

type ImageStudioRequest = {
  prompt?: unknown;
  mode?: unknown;
  image?: unknown;
  aspectRatio?: unknown;
};

type InlineImage = {
  mimeType: string;
  data: string;
};

type GeminiPart = {
  text?: string | null;
  inlineData?: InlineImage | null;
  inline_data?: {
    mime_type?: string | null;
    data?: string | null;
  } | null;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseInlineImage(value: unknown): InlineImage | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const image = value as Record<string, unknown>;
  const mimeType = cleanText(image.mimeType);
  const data = cleanText(image.data);

  if (!mimeType.startsWith("image/") || data.length < 100) {
    return null;
  }

  return { mimeType, data };
}

function normalizeAspectRatio(value: string) {
  if (value === "16:9" || value === "4:3" || value === "1:1") {
    return value;
  }

  return "16:9";
}

function getInlineImageFromPart(part: GeminiPart): InlineImage | null {
  if (part.inlineData?.mimeType && part.inlineData.data) {
    return part.inlineData;
  }

  if (part.inline_data?.mime_type && part.inline_data.data) {
    return {
      mimeType: part.inline_data.mime_type,
      data: part.inline_data.data,
    };
  }

  return null;
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

  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "replace_me") {
    return badRequest("Google AI Image Studio is not configured. Set GOOGLE_AI_API_KEY to your paid Google API key.");
  }

  try {
    const body = (await request.json().catch(() => ({}))) as ImageStudioRequest;
    const prompt = cleanText(body.prompt);
    const mode = cleanText(body.mode) || "generate";
    const aspectRatio = normalizeAspectRatio(cleanText(body.aspectRatio));
    const sourceImage = parseInlineImage(body.image);

    if (prompt.length < 12) {
      return badRequest("Describe the photo you want Google AI to generate or edit.");
    }

    if (mode !== "generate" && mode !== "edit") {
      return badRequest("mode must be 'generate' or 'edit'");
    }

    if (mode === "edit" && !sourceImage) {
      return badRequest("Choose or upload an image before asking Google AI to edit it.");
    }

    const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
      {
        text:
          mode === "edit"
            ? `Edit this image for a banking news article. ${prompt}`
            : `Generate a realistic editorial photo for a banking news article. ${prompt}`,
      },
    ];

    if (sourceImage) {
      parts.unshift({
        inline_data: {
          mime_type: sourceImage.mimeType,
          data: sourceImage.data,
        },
      });
    }

    const model = process.env.GOOGLE_AI_IMAGE_MODEL?.trim() || "gemini-3.1-flash-image";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          responseFormat: {
            image: { aspectRatio },
          },
        },
      }),
    });

    const json = (await response.json().catch(() => ({}))) as {
      candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
    };

    if (!response.ok) {
      const googleMessage = getGoogleErrorMessage(json);
      return serverError(googleMessage ? `Google AI image request failed: ${googleMessage}` : "Google AI image request failed");
    }

    const responseParts = json.candidates?.[0]?.content?.parts ?? [];
    const imagePart = responseParts.map(getInlineImageFromPart).find(Boolean);
    const text = responseParts.map((part) => cleanText(part.text)).filter(Boolean).join("\n");

    if (!imagePart) {
      return serverError("Google AI did not return an image");
    }

    return ok({
      mimeType: imagePart.mimeType,
      data: imagePart.data,
      dataUrl: `data:${imagePart.mimeType};base64,${imagePart.data}`,
      text,
    });
  } catch {
    return serverError("Unable to generate image with Google AI");
  }
}
