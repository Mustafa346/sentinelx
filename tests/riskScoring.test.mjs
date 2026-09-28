import test from "node:test";
import assert from "node:assert/strict";
import { computeRiskScore, riskLevel, RISK_WEIGHTS } from "../lib/riskScoring.js";

test("riskLevel buckets scores correctly per spec (0-29 LOW, 30-59 MEDIUM, 60-79 HIGH, 80-100 CRITICAL)", () => {
  assert.equal(riskLevel(0), "LOW");
  assert.equal(riskLevel(29), "LOW");
  assert.equal(riskLevel(30), "MEDIUM");
  assert.equal(riskLevel(59), "MEDIUM");
  assert.equal(riskLevel(60), "HIGH");
  assert.equal(riskLevel(79), "HIGH");
  assert.equal(riskLevel(80), "CRITICAL");
  assert.equal(riskLevel(100), "CRITICAL");
});

test("computeRiskScore sums factor points and reports the breakdown transparently", () => {
  const factors = [
    { factor: "Failed login", points: RISK_WEIGHTS.FAILED_LOGIN },
    { factor: "New IP", points: RISK_WEIGHTS.NEW_IP },
  ];
  const result = computeRiskScore(factors);
  assert.equal(result.score, RISK_WEIGHTS.FAILED_LOGIN + RISK_WEIGHTS.NEW_IP);
  assert.equal(result.factors.length, 2);
  assert.equal(result.level, riskLevel(result.score));
});

test("computeRiskScore normalizes to a 0-100 range even if factors would exceed it", () => {
  const factors = [
    { factor: "Privilege escalation", points: RISK_WEIGHTS.PRIVILEGE_ESCALATION },
    { factor: "MFA reset", points: RISK_WEIGHTS.MFA_RESET },
    { factor: "Off hours admin login", points: RISK_WEIGHTS.OFF_HOURS_ADMIN_LOGIN },
    { factor: "New device", points: RISK_WEIGHTS.NEW_DEVICE },
  ];
  const result = computeRiskScore(factors);
  assert.ok(result.score <= 100);
});

test("computeRiskScore never goes below 0", () => {
  const result = computeRiskScore([{ factor: "negative test", points: -50 }]);
  assert.equal(result.score, 0);
});
