import test from "node:test";
import assert from "node:assert/strict";
import { validateEditorialWorkflow } from "./editorial-workflow";

const publishableArticle = {
  status: "published" as const,
  featuredImageUrl: "/api/media/blob/12",
  sourceUrl: "https://example.com/official-statement",
};

test("published articles cannot explicitly remain unverified", () => {
  assert.match(
    validateEditorialWorkflow({ ...publishableArticle, sourceVerificationStatus: "unverified" }) ?? "",
    /verification must be completed/i
  );
});

test("official sources require attribution and a verification date", () => {
  assert.match(
    validateEditorialWorkflow({ ...publishableArticle, sourceVerificationStatus: "official" }) ?? "",
    /verification date/i
  );

  assert.match(
    validateEditorialWorkflow({
      ...publishableArticle,
      sourceVerificationStatus: "official",
      sourceLastVerifiedAt: "2026-08-11",
    }) ?? "",
    /source attribution/i
  );
});

test("a fully recorded official source passes editorial validation", () => {
  assert.equal(
    validateEditorialWorkflow({
      ...publishableArticle,
      sourceAttribution: "Central Bank of Sudan",
      sourceVerificationStatus: "official",
      sourceLastVerifiedAt: "2026-08-11",
    }),
    null
  );
});
