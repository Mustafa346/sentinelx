import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * Minimal, dependency-free password policy check. Returns an array of
 * problems (empty = valid).
 */
export function validatePasswordStrength(password) {
  const problems = [];
  if (!password || password.length < 8) problems.push("Password must be at least 8 characters.");
  if (!/[A-Z]/.test(password)) problems.push("Password must contain an uppercase letter.");
  if (!/[a-z]/.test(password)) problems.push("Password must contain a lowercase letter.");
  if (!/[0-9]/.test(password)) problems.push("Password must contain a number.");
  return problems;
}
