import User from "@/models/User";
import { recordIdentityEvent } from "./eventPipeline";
import { generateId } from "@/lib/utils";

// All simulated traffic is tagged with isSimulated + a batchId so it's
// clearly distinguishable in the UI. No external system is ever contacted.
const DEVICES = ["Desktop", "Mobile", "Laptop"];
const BROWSERS = ["Chrome", "Firefox", "Edge"];
const OS_LIST = ["Windows", "Linux", "macOS"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function pickEmployees(limit = 6) {
  const users = await User.find({ role: "EMPLOYEE", status: "ACTIVE" }).limit(limit);
  return users;
}

export async function simulatePasswordSpray() {
  const batchId = generateId("SIM");
  const sourceIP = `198.51.100.${Math.floor(Math.random() * 250)}`;
  const targets = await pickEmployees(6);
  if (targets.length < 3) throw new Error("Need at least 3 employee accounts seeded to run this simulation.");

  const outcomes = [];
  let count = 0;
  for (const target of targets) {
    const attempts = 2 + Math.floor(Math.random() * 2); // 2-3 attempts per user
    for (let i = 0; i < attempts; i++) {
      count += 1;
      const { alertOutcomes } = await recordIdentityEvent({
        username: target.username,
        userId: target._id,
        eventType: "LOGIN_FAILURE",
        result: "FAILED",
        failureReason: "INVALID_PASSWORD",
        sourceIP,
        country: "Netherlands",
        city: "Amsterdam",
        device: "Desktop",
        browser: "Chrome",
        operatingSystem: "Linux",
        simulation: { isSimulated: true, scenario: "PASSWORD_SPRAY", batchId },
      });
      outcomes.push(...alertOutcomes);
    }
  }

  // one of the sprayed accounts eventually "succeeds" - realistic ending
  const luckyTarget = pick(targets);
  const { alertOutcomes } = await recordIdentityEvent({
    username: luckyTarget.username,
    userId: luckyTarget._id,
    eventType: "LOGIN_SUCCESS",
    result: "SUCCESS",
    sourceIP,
    country: "Netherlands",
    city: "Amsterdam",
    device: "Desktop",
    browser: "Chrome",
    operatingSystem: "Linux",
    simulation: { isSimulated: true, scenario: "PASSWORD_SPRAY", batchId },
  });
  outcomes.push(...alertOutcomes);

  return { batchId, eventsGenerated: count + 1, alertsCreated: dedupeAlerts(outcomes) };
}

export async function simulateMfaAbuse() {
  const batchId = generateId("SIM");
  const [target] = await pickEmployees(1);
  if (!target) throw new Error("Need at least one employee account seeded.");
  const sourceIP = `203.0.113.${Math.floor(Math.random() * 250)}`;

  const outcomes = [];
  for (let i = 0; i < 3; i++) {
    const { alertOutcomes } = await recordIdentityEvent({
      username: target.username,
      userId: target._id,
      eventType: "MFA_RESET",
      result: "INFO",
      sourceIP,
      country: "Pakistan",
      city: "Karachi",
      device: pick(DEVICES),
      browser: pick(BROWSERS),
      operatingSystem: pick(OS_LIST),
      simulation: { isSimulated: true, scenario: "MFA_ABUSE", batchId },
    });
    outcomes.push(...alertOutcomes);
  }

  const { alertOutcomes } = await recordIdentityEvent({
    username: target.username,
    userId: target._id,
    eventType: "LOGIN_SUCCESS",
    result: "SUCCESS",
    sourceIP,
    country: "Pakistan",
    city: "Karachi",
    device: pick(DEVICES),
    browser: pick(BROWSERS),
    operatingSystem: pick(OS_LIST),
    simulation: { isSimulated: true, scenario: "MFA_ABUSE", batchId },
  });
  outcomes.push(...alertOutcomes);

  return { batchId, eventsGenerated: 4, alertsCreated: dedupeAlerts(outcomes), targetUser: target.username };
}

export async function simulatePrivilegeEscalation() {
  const batchId = generateId("SIM");
  const [target] = await pickEmployees(1);
  if (!target) throw new Error("Need at least one employee account seeded.");
  const sourceIP = `10.0.5.${Math.floor(Math.random() * 250)}`;

  const outcomes = [];

  const loginResult = await recordIdentityEvent({
    username: target.username,
    userId: target._id,
    eventType: "LOGIN_FAILURE",
    result: "FAILED",
    failureReason: "INVALID_PASSWORD",
    sourceIP,
    country: "Pakistan",
    city: "Islamabad",
    device: pick(DEVICES),
    browser: pick(BROWSERS),
    operatingSystem: pick(OS_LIST),
    simulation: { isSimulated: true, scenario: "PRIVILEGE_ESCALATION", batchId },
  });
  outcomes.push(...loginResult.alertOutcomes);

  const escalationResult = await recordIdentityEvent({
    username: target.username,
    userId: target._id,
    eventType: "ROLE_CHANGED",
    result: "INFO",
    previousRole: target.role,
    newRole: "ADMIN",
    sourceIP,
    country: "Pakistan",
    city: "Islamabad",
    device: pick(DEVICES),
    browser: pick(BROWSERS),
    operatingSystem: pick(OS_LIST),
    simulation: { isSimulated: true, scenario: "PRIVILEGE_ESCALATION", batchId },
  });
  outcomes.push(...escalationResult.alertOutcomes);

  return { batchId, eventsGenerated: 2, alertsCreated: dedupeAlerts(outcomes), targetUser: target.username };
}

export async function simulateUnusualAdminLogin() {
  const batchId = generateId("SIM");
  const admin = await User.findOne({ role: "ADMIN", status: "ACTIVE" });
  if (!admin) throw new Error("No active admin account found to simulate against.");

  const { alertOutcomes } = await recordIdentityEvent({
    username: admin.username,
    userId: admin._id,
    eventType: "LOGIN_SUCCESS",
    result: "SUCCESS",
    sourceIP: `45.32.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
    country: "United Arab Emirates",
    city: "Dubai",
    device: "Mobile",
    browser: "Safari",
    operatingSystem: "iOS",
    timestamp: setHour(2), // force off-hours
    simulation: { isSimulated: true, scenario: "UNUSUAL_ADMIN_LOGIN", batchId },
  });

  return { batchId, eventsGenerated: 1, alertsCreated: dedupeAlerts(alertOutcomes), targetUser: admin.username };
}

export async function simulateImpossibleTravel() {
  const batchId = generateId("SIM");
  const [target] = await pickEmployees(1);
  if (!target) throw new Error("Need at least one employee account seeded.");

  const first = await recordIdentityEvent({
    username: target.username,
    userId: target._id,
    eventType: "LOGIN_SUCCESS",
    result: "SUCCESS",
    sourceIP: `39.45.${Math.floor(Math.random() * 250)}.10`,
    country: "Pakistan",
    city: "Peshawar",
    device: pick(DEVICES),
    browser: pick(BROWSERS),
    operatingSystem: pick(OS_LIST),
    simulation: { isSimulated: true, scenario: "IMPOSSIBLE_TRAVEL", batchId },
  });

  const second = await recordIdentityEvent({
    username: target.username,
    userId: target._id,
    eventType: "LOGIN_SUCCESS",
    result: "SUCCESS",
    sourceIP: `104.28.${Math.floor(Math.random() * 250)}.20`,
    country: "United States",
    city: "New York",
    device: pick(DEVICES),
    browser: pick(BROWSERS),
    operatingSystem: pick(OS_LIST),
    timestamp: new Date(Date.now() + 5 * 60_000), // "5 minutes later"
    simulation: { isSimulated: true, scenario: "IMPOSSIBLE_TRAVEL", batchId },
  });

  return {
    batchId,
    eventsGenerated: 2,
    alertsCreated: dedupeAlerts([...first.alertOutcomes, ...second.alertOutcomes]),
    targetUser: target.username,
  };
}

export async function simulateNewDevice() {
  const batchId = generateId("SIM");
  const [target] = await pickEmployees(1);
  if (!target) throw new Error("Need at least one employee account seeded.");

  const { alertOutcomes } = await recordIdentityEvent({
    username: target.username,
    userId: target._id,
    eventType: "LOGIN_SUCCESS",
    result: "SUCCESS",
    sourceIP: `172.16.${Math.floor(Math.random() * 250)}.5`,
    country: "Pakistan",
    city: "Quetta",
    device: "Mobile",
    browser: "Safari",
    operatingSystem: "iOS",
    simulation: { isSimulated: true, scenario: "NEW_DEVICE", batchId },
  });

  return { batchId, eventsGenerated: 1, alertsCreated: dedupeAlerts(alertOutcomes), targetUser: target.username };
}

export async function simulateSuspiciousNewIP() {
  const batchId = generateId("SIM");
  const [target] = await pickEmployees(1);
  if (!target) throw new Error("Need at least one employee account seeded.");

  const { alertOutcomes } = await recordIdentityEvent({
    username: target.username,
    userId: target._id,
    eventType: "LOGIN_SUCCESS",
    result: "SUCCESS",
    sourceIP: `185.220.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
    country: "Germany",
    city: "Frankfurt",
    device: target.baseline?.knownDevices?.[0] || "Desktop",
    browser: pick(BROWSERS),
    operatingSystem: pick(OS_LIST),
    simulation: { isSimulated: true, scenario: "NEW_IP", batchId },
  });

  return { batchId, eventsGenerated: 1, alertsCreated: dedupeAlerts(alertOutcomes), targetUser: target.username };
}

export async function simulateAccountTakeover() {
  const batchId = generateId("SIM");
  const [target] = await pickEmployees(1);
  if (!target) throw new Error("Need at least one employee account seeded.");
  const sourceIP = `91.219.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

  const outcomes = [];

  for (let i = 0; i < 3; i++) {
    const r = await recordIdentityEvent({
      username: target.username,
      userId: target._id,
      eventType: "LOGIN_FAILURE",
      result: "FAILED",
      failureReason: "INVALID_PASSWORD",
      sourceIP,
      country: "Brazil",
      city: "Sao Paulo",
      device: "Desktop",
      browser: "Chrome",
      operatingSystem: "Linux",
      simulation: { isSimulated: true, scenario: "ACCOUNT_TAKEOVER", batchId },
    });
    outcomes.push(...r.alertOutcomes);
  }

  const mfa = await recordIdentityEvent({
    username: target.username,
    userId: target._id,
    eventType: "MFA_RESET",
    result: "INFO",
    sourceIP,
    country: "Brazil",
    city: "Sao Paulo",
    device: "Desktop",
    browser: "Chrome",
    operatingSystem: "Linux",
    simulation: { isSimulated: true, scenario: "ACCOUNT_TAKEOVER", batchId },
  });
  outcomes.push(...mfa.alertOutcomes);

  const success = await recordIdentityEvent({
    username: target.username,
    userId: target._id,
    eventType: "LOGIN_SUCCESS",
    result: "SUCCESS",
    sourceIP,
    country: "Brazil",
    city: "Sao Paulo",
    device: "Desktop",
    browser: "Chrome",
    operatingSystem: "Linux",
    simulation: { isSimulated: true, scenario: "ACCOUNT_TAKEOVER", batchId },
  });
  outcomes.push(...success.alertOutcomes);

  return { batchId, eventsGenerated: 5, alertsCreated: dedupeAlerts(outcomes), targetUser: target.username };
}

function setHour(hour) {
  const d = new Date();
  d.setHours(hour, Math.floor(Math.random() * 59), 0, 0);
  return d;
}

function dedupeAlerts(outcomes) {
  const seen = new Map();
  for (const o of outcomes) {
    seen.set(o.alert.alertId, o.alert);
  }
  return Array.from(seen.values());
}
