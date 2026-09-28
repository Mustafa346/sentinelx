// Transparent, explainable risk scoring. No black box - every point added
// is tied to a named factor that gets stored alongside the score.

export const RISK_WEIGHTS = {
  FAILED_LOGIN: 10,
  NEW_IP: 15,
  NEW_DEVICE: 15,
  NEW_LOCATION: 15,
  MFA_RESET: 25,
  PRIVILEGE_ESCALATION: 40,
  OFF_HOURS_ADMIN_LOGIN: 25,
  MULTIPLE_SUSPICIOUS_EVENTS: 10, // additional correlation bump, applied per extra factor beyond the first
};

export function riskLevel(score) {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

/**
 * factors: array of { factor: string, points: number }
 * Returns a normalized 0-100 score plus the factor breakdown, so the UI can
 * always show "why" a score is what it is.
 */
export function computeRiskScore(factors) {
  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  const normalized = Math.max(0, Math.min(100, raw));
  return {
    score: normalized,
    level: riskLevel(normalized),
    factors,
  };
}
