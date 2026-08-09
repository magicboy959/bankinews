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

type InteractionImage = {
  data?: string | null;
  mime_type?: string | null;
  mimeType?: string | null;
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

function getOutputImage(value: unknown): InlineImage | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const response = value as { output_image?: InteractionImage | null; outputImage?: InteractionImage | null };
  const outputImage = response.output_image ?? response.outputImage;
  const data = cleanText(outputImage?.data);
  const mimeType = cleanText(outputImage?.mime_type ?? outputImage?.mimeType) || "image/jpeg";

  if (!data || data.length < 100) {
    return null;
  }

  return { data, mimeType };
}

function getImageFromUnknown(value: unknown): InlineImage | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    type?: unknown;
    data?: unknown;
    mime_type?: unknown;
    mimeType?: unknown;
    inlineData?: InlineImage | null;
    inline_data?: { mime_type?: string | null; data?: string | null } | null;
    image?: unknown;
    content?: unknown;
    parts?: unknown;
    steps?: unknown;
  };

  if (candidate.inlineData?.data) {
    return candidate.inlineData;
  }

  if (candidate.inline_data?.data) {
    return {
      data: candidate.inline_data.data,
      mimeType: candidate.inline_data.mime_type || "image/jpeg",
    };
  }

  const type = cleanText(candidate.type);
  const data = cleanText(candidate.data);
  const mimeType = cleanText(candidate.mime_type ?? candidate.mimeType);

  if ((type === "image" || mimeType.startsWith("image/")) && data.length > 100) {
    return { data, mimeType: mimeType || "image/jpeg" };
  }

  const directImage = getImageFromUnknown(candidate.image);
  if (directImage) {
    return directImage;
  }

  for (const nested of [candidate.content, candidate.parts, candidate.steps]) {
    if (Array.isArray(nested)) {
      for (const item of nested) {
        const image = getImageFromUnknown(item);
        if (image) {
          return image;
        }
      }
    }
  }

  return null;
}

function findImageDeep(value: unknown, depth = 0): InlineImage | null {
  if (!value || depth > 8) {
    return null;
  }

  const direct = getImageFromUnknown(value);
  if (direct) {
    return direct;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const image = findImageDeep(item, depth + 1);
      if (image) {
        return image;
      }
    }
    return null;
  }

  if (typeof value !== "object") {
    return null;
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
    return { data, mimeType: mimeType || "image/jpeg" };
  }

  for (const item of Object.values(objectValue)) {
    const image = findImageDeep(item, depth + 1);
    if (image) {
      return image;
    }
  }

  return null;
}

function summarizeShape(value: unknown, depth = 0): string {
  if (!value || typeof value !== "object" || depth > 2) {
    return typeof value;
  }

  if (Array.isArray(value)) {
    return `[${value.slice(0, 2).map((item) => summarizeShape(item, depth + 1)).join(", ")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  return `{${Object.entries(objectValue)
    .slice(0, 8)
    .map(([key, item]) => `${key}:${Array.isArray(item) ? `array(${item.length})` : typeof item}`)
    .join(", ")}}`;
}

function collectText(value: unknown, output: string[] = []) {
  if (!value || typeof value !== "object") {
    return output;
  }

  const candidate = value as {
    text?: unknown;
    output_text?: unknown;
    outputText?: unknown;
    content?: unknown;
    parts?: unknown;
    steps?: unknown;
  };
  const text = cleanText(candidate.text ?? candidate.output_text ?? candidate.outputText);
  if (text) {
    output.push(text);
  }

  for (const nested of [candidate.content, candidate.parts, candidate.steps]) {
    if (Array.isArray(nested)) {
      for (const item of nested) {
        collectText(item, output);
      }
    }
  }

  return output;
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

    const textInput = {
      type: "text" as const,
      text:
        mode === "edit"
          ? `Edit this image for a banking news article. Prefer a ${aspectRatio} composition when possible. ${prompt}`
          : `Generate a realistic editorial photo for a banking news article. Prefer a ${aspectRatio} composition. ${prompt}`,
    };
    const input: Array<{ type: "text"; text: string } | { type: "image"; mime_type: string; data: string }> = [
      {
        ...textInput,
      },
    ];

    if (sourceImage) {
      input.unshift({
        type: "image",
        mime_type: sourceImage.mimeType,
        data: sourceImage.data,
      });
    }

    const model = normalizeGeminiModel(process.env.GOOGLE_AI_IMAGE_MODEL ?? "", "gemini-3.1-flash-image");
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        input,
        response_format: {
          type: "image",
          mime_type: "image/jpeg",
          aspect_ratio: aspectRatio,
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
      return serverError(googleMessage ? `Google AI image request failed: ${googleMessage}` : "Google AI image request failed");
    }

    const responseParts = json.candidates?.[0]?.content?.parts ?? [];
    const imagePart = getOutputImage(json) ?? findImageDeep(json) ?? responseParts.map(getInlineImageFromPart).find(Boolean);
    const text = collectText(json).join("\n").trim();

    if (!imagePart) {
      return serverError(
        text
          ? `Google AI did not return an image. Response: ${text.slice(0, 240)}`
          : `Google AI did not return an image. Response shape: ${summarizeShape(json)}`
      );
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
