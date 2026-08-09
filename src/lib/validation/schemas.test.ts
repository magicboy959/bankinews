import test from "node:test";
import assert from "node:assert/strict";
import { articleCreateSchema } from "./schemas";

test("articleCreateSchema accepts local media paths for image and source URLs", () => {
  const result = articleCreateSchema.safeParse({
    locale: "ar",
    title: "اختبار مقال",
    summary: "هذا ملخص مناسب للمقال الذي يتم تحريره.",
    contentHtml: "<p>محتوى مقال مفصل ومناسب للنشر.</p>",
    articleType: "news",
    status: "draft",
    featuredImageUrl: "/api/media/blob/12",
    videoUrl: "https://www.youtube.com/watch?v=abc1234",
    sourceUrl: "https://example.com/article",
  });

  assert.equal(result.success, true);
});

test("articleCreateSchema clears invalid optional source URL values", () => {
  const result = articleCreateSchema.safeParse({
    locale: "ar",
    title: "اختبار مقال",
    summary: "هذا ملخص مناسب للمقال الذي يتم تحريره.",
    contentHtml: "<p>محتوى مقال مفصل ومناسب للنشر.</p>",
    articleType: "news",
    status: "draft",
    featuredImageUrl: "/api/media/blob/12",
    sourceUrl: "Google AI generated image",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.sourceUrl, null);
});

test("articleCreateSchema clears temporary data URLs from optional URL fields", () => {
  const result = articleCreateSchema.safeParse({
    locale: "ar",
    title: "اختبار مقال",
    summary: "هذا ملخص مناسب للمقال الذي يتم تحريره.",
    contentHtml: "<p>محتوى مقال مفصل ومناسب للنشر.</p>",
    articleType: "news",
    status: "draft",
    featuredImageUrl: "data:image/jpeg;base64,abcdef",
    sourceUrl: "data:image/jpeg;base64,abcdef",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.featuredImageUrl, null);
  assert.equal(result.data.sourceUrl, null);
});
