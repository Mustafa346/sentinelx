import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, validatePasswordStrength } from "../lib/password.js";

test("hashPassword produces a bcrypt hash that verifyPassword can check", async () => {
  const hash = await hashPassword("Passw0rd!");
  assert.notEqual(hash, "Passw0rd!");
  assert.ok(hash.startsWith("$2"));
  assert.equal(await verifyPassword("Passw0rd!", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});

test("validatePasswordStrength rejects short passwords", () => {
  const problems = validatePasswordStrength("Ab1");
  assert.ok(problems.length > 0);
});

test("validatePasswordStrength rejects passwords missing a number", () => {
  const problems = validatePasswordStrength("Abcdefgh");
  assert.ok(problems.some((p) => /number/i.test(p)));
});

test("validatePasswordStrength rejects passwords missing uppercase", () => {
  const problems = validatePasswordStrength("abcdefg1");
  assert.ok(problems.some((p) => /uppercase/i.test(p)));
});

test("validatePasswordStrength accepts a strong password", () => {
  const problems = validatePasswordStrength("Passw0rd!");
  assert.deepEqual(problems, []);
});
