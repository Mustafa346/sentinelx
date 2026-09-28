import test from "node:test";
import assert from "node:assert/strict";
import { isExcluded } from "../lib/exclusions.js";

test("isExcluded returns false when a rule has no exclusions", () => {
  const rule = { exclusions: [] };
  assert.equal(isExcluded(rule, { sourceIP: "10.0.0.1", username: "admin", timestamp: new Date() }), false);
});

test("isExcluded matches on sourceIP", () => {
  const rule = { exclusions: [{ sourceIP: "10.0.0.50", username: null, startHour: null, endHour: null }] };
  assert.equal(isExcluded(rule, { sourceIP: "10.0.0.50", username: "admin", timestamp: new Date() }), true);
  assert.equal(isExcluded(rule, { sourceIP: "10.0.0.51", username: "admin", timestamp: new Date() }), false);
});

test("isExcluded matches on username", () => {
  const rule = { exclusions: [{ sourceIP: null, username: "service", startHour: null, endHour: null }] };
  assert.equal(isExcluded(rule, { sourceIP: "1.2.3.4", username: "service", timestamp: new Date() }), true);
  assert.equal(isExcluded(rule, { sourceIP: "1.2.3.4", username: "someone-else", timestamp: new Date() }), false);
});

test("isExcluded respects an overnight time window (e.g. 00:00-03:00)", () => {
  const rule = {
    exclusions: [{ sourceIP: "10.0.0.50", username: "admin", startHour: 0, endHour: 3 }],
  };

  const at1am = new Date();
  at1am.setHours(1, 0, 0, 0);
  const at5pm = new Date();
  at5pm.setHours(17, 0, 0, 0);

  assert.equal(isExcluded(rule, { sourceIP: "10.0.0.50", username: "admin", timestamp: at1am }), true);
  assert.equal(isExcluded(rule, { sourceIP: "10.0.0.50", username: "admin", timestamp: at5pm }), false);
});

test("isExcluded requires all specified conditions to match (IP AND username AND window)", () => {
  const rule = {
    exclusions: [{ sourceIP: "10.0.0.50", username: "admin", startHour: 0, endHour: 3 }],
  };
  const at1am = new Date();
  at1am.setHours(1, 0, 0, 0);

  // right IP, wrong user
  assert.equal(isExcluded(rule, { sourceIP: "10.0.0.50", username: "someone-else", timestamp: at1am }), false);
});
