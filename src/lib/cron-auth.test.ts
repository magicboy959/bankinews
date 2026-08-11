import test from "node:test";
import assert from "node:assert/strict";
import { isAuthorizedCronRequest } from "./cron-auth";

test("cron authentication fails closed when the server secret is missing", () => {
  assert.equal(isAuthorizedCronRequest("Bearer supplied", undefined), false);
});

test("cron authentication rejects missing and incorrect bearer tokens", () => {
  assert.equal(isAuthorizedCronRequest(null, "expected-secret"), false);
  assert.equal(isAuthorizedCronRequest("Bearer wrong-secret", "expected-secret"), false);
});

test("cron authentication accepts an exact bearer token", () => {
  assert.equal(isAuthorizedCronRequest("Bearer expected-secret", "expected-secret"), true);
});
