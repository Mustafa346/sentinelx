import test from "node:test";
import assert from "node:assert/strict";
import { generateId, parseUserAgent, isOffHours } from "../lib/utils.js";

test("generateId produces unique, prefixed ids", () => {
  const a = generateId("EVT");
  const b = generateId("EVT");
  assert.ok(a.startsWith("EVT-"));
  assert.notEqual(a, b);
});

test("parseUserAgent recognizes common browsers and OSes", () => {
  const chrome = parseUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
  );
  assert.equal(chrome.browser, "Chrome");
  assert.equal(chrome.os, "Windows");
  assert.equal(chrome.device, "Desktop");

  const iphone = parseUserAgent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  );
  assert.equal(iphone.os, "iOS");
  assert.equal(iphone.device, "Mobile");
});

test("isOffHours correctly flags times outside business hours", () => {
  const twoAM = new Date();
  twoAM.setHours(2, 0, 0, 0);
  const noon = new Date();
  noon.setHours(12, 0, 0, 0);

  assert.equal(isOffHours(twoAM, 8, 18), true);
  assert.equal(isOffHours(noon, 8, 18), false);
});
