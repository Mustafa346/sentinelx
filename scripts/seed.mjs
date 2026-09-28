import "dotenv/config";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import User, { DEPARTMENTS } from "../models/User.js";
import IdentityEvent from "../models/IdentityEvent.js";
import DetectionRule from "../models/DetectionRule.js";
import Alert from "../models/Alert.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";
import Playbook from "../models/Playbook.js";
import { DEFAULT_DETECTION_RULES, DEFAULT_PLAYBOOKS } from "../lib/defaultRules.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Copy .env.example to .env.local first.");
  process.exit(1);
}

function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
}

function minutesAgo(n) {
  return new Date(Date.now() - n * 60_000);
}

function hoursAgo(n) {
  return new Date(Date.now() - n * 60 * 60_000);
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60_000);
}

const DEVICES = ["Desktop", "Mobile", "Laptop"];
const BROWSERS = ["Chrome", "Firefox", "Edge", "Safari"];
const OS_LIST = ["Windows", "macOS", "Linux"];
const CITIES = [
  { country: "Pakistan", city: "Peshawar" },
  { country: "Pakistan", city: "Islamabad" },
  { country: "Pakistan", city: "Lahore" },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIP(seed) {
  return seed || `10.0.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 250)}`;
}

async function main() {
  console.log("Connecting to", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log("Clearing existing demo data (users are preserved if you re-run with --keep-users)...");
  const keepUsers = process.argv.includes("--keep-users");

  await IdentityEvent.deleteMany({});
  await Alert.deleteMany({});
  await AuditLog.deleteMany({});
  await Notification.deleteMany({});
  await DetectionRule.deleteMany({});
  await Playbook.deleteMany({});
  if (!keepUsers) await User.deleteMany({});

  // ---------------------------------------------------------------------
  // 1. Detection rules + playbooks
  // ---------------------------------------------------------------------
  const rules = await DetectionRule.insertMany(DEFAULT_DETECTION_RULES);
  const ruleByType = Object.fromEntries(rules.map((r) => [r.detectionType, r]));
  await Playbook.insertMany(DEFAULT_PLAYBOOKS);
  console.log(`Seeded ${rules.length} detection rules and ${DEFAULT_PLAYBOOKS.length} playbooks.`);

  // ---------------------------------------------------------------------
  // 2. Users
  // ---------------------------------------------------------------------
  const passwordHash = await bcrypt.hash("Passw0rd!", 12);

  const seedUsersSpec = [
    { name: "Ayesha Khan", username: "admin", email: "admin@sentinelx.local", role: "ADMIN", department: "Security" },
    { name: "Bilal Ahmed", username: "analyst", email: "analyst@sentinelx.local", role: "SECURITY_ANALYST", department: "Security" },
    { name: "Sara Malik", username: "employee", email: "employee@sentinelx.local", role: "EMPLOYEE", department: "Finance" },
    { name: "Service Account", username: "service", email: "service@sentinelx.local", role: "EMPLOYEE", department: "IT" },
    { name: "Usman Tariq", username: "utariq", email: "utariq@sentinelx.local", role: "EMPLOYEE", department: "Engineering" },
    { name: "Hina Riaz", username: "hriaz", email: "hriaz@sentinelx.local", role: "EMPLOYEE", department: "HR" },
    { name: "Zeeshan Iqbal", username: "ziqbal", email: "ziqbal@sentinelx.local", role: "EMPLOYEE", department: "IT" },
    { name: "Mahnoor Aslam", username: "maslam", email: "maslam@sentinelx.local", role: "EMPLOYEE", department: "Finance" },
    { name: "Ali Raza", username: "araza", email: "araza@sentinelx.local", role: "EMPLOYEE", department: "Engineering" },
    { name: "Sana Farooq", username: "sfarooq", email: "sfarooq@sentinelx.local", role: "EMPLOYEE", department: "Management" },
    { name: "Omar Sheikh", username: "osheikh", email: "osheikh@sentinelx.local", role: "SECURITY_ANALYST", department: "Security" },
    { name: "Nadia Butt", username: "nbutt", email: "nbutt@sentinelx.local", role: "EMPLOYEE", department: "HR" },
  ];

  let users;
  if (keepUsers) {
    users = await User.find({});
  } else {
    users = await User.insertMany(
      seedUsersSpec.map((u) => ({
        ...u,
        passwordHash,
        status: "ACTIVE",
        riskScore: 0,
        isSeedAccount: true,
        baseline: {
          knownIPs: [randomIP()],
          knownDevices: [pick(DEVICES)],
          knownCountries: ["Pakistan"],
          normalLoginHourStart: 8,
          normalLoginHourEnd: 18,
        },
      }))
    );
  }
  console.log(`Seeded ${users.length} users. Demo password for all seed accounts: Passw0rd!`);

  const admin = users.find((u) => u.username === "admin");
  const analyst = users.find((u) => u.username === "analyst");

  // ---------------------------------------------------------------------
  // 3. Normal historical activity (last 14 days) - gives the dashboard
  //    charts a realistic non-empty baseline.
  // ---------------------------------------------------------------------
  const events = [];
  for (const user of users) {
    const homeIP = user.baseline?.knownIPs?.[0] || randomIP();
    const homeDevice = user.baseline?.knownDevices?.[0] || pick(DEVICES);
    for (let d = 13; d >= 0; d--) {
      // 1-2 normal logins per weekday
      const loginsToday = Math.random() > 0.3 ? 1 : 2;
      for (let i = 0; i < loginsToday; i++) {
        const ts = new Date(daysAgo(d).getTime() + (8 + Math.random() * 9) * 60 * 60_000);
        events.push({
          eventId: generateId("EVT"),
          timestamp: ts,
          userId: user._id,
          username: user.username,
          eventType: "LOGIN_SUCCESS",
          result: "SUCCESS",
          sourceIP: homeIP,
          country: "Pakistan",
          city: pick(CITIES).city,
          device: homeDevice,
          browser: pick(BROWSERS),
          operatingSystem: pick(OS_LIST),
          riskScore: 0,
        });
        events.push({
          eventId: generateId("EVT"),
          timestamp: new Date(ts.getTime() + (30 + Math.random() * 200) * 60_000),
          userId: user._id,
          username: user.username,
          eventType: "LOGOUT",
          result: "INFO",
          sourceIP: homeIP,
          country: "Pakistan",
          city: "Peshawar",
          device: homeDevice,
          browser: pick(BROWSERS),
          operatingSystem: pick(OS_LIST),
        });
      }
      // occasional stray failed login (mistyped password, not an attack)
      if (Math.random() > 0.85) {
        events.push({
          eventId: generateId("EVT"),
          timestamp: new Date(daysAgo(d).getTime() + Math.random() * 20 * 60 * 60_000),
          userId: user._id,
          username: user.username,
          eventType: "LOGIN_FAILURE",
          result: "FAILED",
          failureReason: "INVALID_PASSWORD",
          sourceIP: homeIP,
          country: "Pakistan",
          city: "Peshawar",
          device: homeDevice,
          browser: pick(BROWSERS),
          operatingSystem: pick(OS_LIST),
        });
      }
    }
  }
  await IdentityEvent.insertMany(events);
  console.log(`Seeded ${events.length} baseline identity events.`);

  // ---------------------------------------------------------------------
  // 4. A handful of pre-baked suspicious scenarios with resulting alerts,
  //    some already triaged as true positive, some as false positive, so
  //    Detection Quality / False Positive stats are meaningful on first run.
  // ---------------------------------------------------------------------
  const victim = users.find((u) => u.username === "utariq");
  const sprayIP = "203.0.113.45";
  const sprayTargets = users.slice(2, 7);
  const sprayEvidence = [];

  const sprayBase = hoursAgo(6);
  let cursor = sprayBase.getTime();
  for (const target of sprayTargets) {
    for (let i = 0; i < 3; i++) {
      cursor += 8_000;
      const doc = await IdentityEvent.create({
        eventId: generateId("EVT"),
        timestamp: new Date(cursor),
        userId: target._id,
        username: target.username,
        eventType: "LOGIN_FAILURE",
        result: "FAILED",
        failureReason: "INVALID_PASSWORD",
        sourceIP: sprayIP,
        country: "Russia",
        city: "Moscow",
        device: "Desktop",
        browser: "Chrome",
        operatingSystem: "Linux",
        simulation: { isSimulated: true, scenario: "PASSWORD_SPRAY", batchId: "seed-demo" },
      });
      sprayEvidence.push(doc._id);
    }
  }
  const sprayAlert = await Alert.create({
    alertId: generateId("ALT"),
    title: "Password Spray Detected",
    description: `15 failed logins against ${sprayTargets.length} distinct users from ${sprayIP} within 5 minutes.`,
    severity: "HIGH",
    detectionRule: ruleByType.PASSWORD_SPRAY._id,
    detectionType: "PASSWORD_SPRAY",
    sourceIP: sprayIP,
    timestamp: new Date(cursor),
    status: "TRUE_POSITIVE",
    assignedAnalyst: analyst._id,
    riskScore: 85,
    riskFactors: [
      { factor: "Multiple failed logins from one source", points: 50 },
      { factor: `Password spray pattern across ${sprayTargets.length} accounts`, points: 35 },
    ],
    mitreTechniqueId: "T1110.003",
    mitreTechniqueName: "Password Spraying",
    evidence: sprayEvidence,
    correlationKey: `PASSWORD_SPRAY:${sprayIP}:seed`,
    investigationNotes: [
      { author: analyst._id, note: "Confirmed external IP with no successful logins. Blocked at perimeter and confirmed as true positive.", createdAt: hoursAgo(5) },
    ],
    simulation: { isSimulated: true, scenario: "PASSWORD_SPRAY", batchId: "seed-demo" },
  });

  // Unusual admin login - false positive (admin traveling, later confirmed legitimate)
  const adminLoginEvent = await IdentityEvent.create({
    eventId: generateId("EVT"),
    timestamp: hoursAgo(20),
    userId: admin._id,
    username: admin.username,
    eventType: "LOGIN_SUCCESS",
    result: "SUCCESS",
    sourceIP: "182.191.20.4",
    country: "Pakistan",
    city: "Lahore",
    device: "Laptop",
    browser: "Edge",
    operatingSystem: "Windows",
  });
  const fpAlert = await Alert.create({
    alertId: generateId("ALT"),
    title: "Unusual Admin Login Detected",
    description: "Admin admin logged in from a new/unrecognized IP.",
    severity: "HIGH",
    detectionRule: ruleByType.UNUSUAL_ADMIN_LOGIN._id,
    detectionType: "UNUSUAL_ADMIN_LOGIN",
    user: admin._id,
    username: admin.username,
    sourceIP: "182.191.20.4",
    timestamp: hoursAgo(20),
    status: "FALSE_POSITIVE",
    assignedAnalyst: analyst._id,
    riskScore: 40,
    riskFactors: [{ factor: "Admin login from new IP", points: 15 }],
    mitreTechniqueId: "T1078.003",
    mitreTechniqueName: "Valid Accounts: Local Accounts",
    evidence: [adminLoginEvent._id],
    correlationKey: `UNUSUAL_ADMIN_LOGIN:admin:seed-fp`,
    falsePositiveReason: "Known admin activity",
    investigationNotes: [
      { author: analyst._id, note: "Verified with admin directly - traveling for a conference, using hotel WiFi. Marked as false positive and will add exception for this trip.", createdAt: hoursAgo(19) },
    ],
  });

  // A still-open MEDIUM new-device alert awaiting triage, for a realistic queue
  const newDeviceEvent = await IdentityEvent.create({
    eventId: generateId("EVT"),
    timestamp: minutesAgo(90),
    userId: victim._id,
    username: victim.username,
    eventType: "LOGIN_SUCCESS",
    result: "SUCCESS",
    sourceIP: "39.45.12.90",
    country: "Pakistan",
    city: "Karachi",
    device: "Mobile",
    browser: "Safari",
    operatingSystem: "iOS",
  });
  await Alert.create({
    alertId: generateId("ALT"),
    title: "New Device Login Detected",
    description: `${victim.username} logged in from a previously unseen device (Mobile, Safari/iOS).`,
    severity: "MEDIUM",
    detectionRule: ruleByType.NEW_DEVICE._id,
    detectionType: "NEW_DEVICE",
    user: victim._id,
    username: victim.username,
    sourceIP: "39.45.12.90",
    timestamp: minutesAgo(90),
    status: "NEW",
    riskScore: 30,
    riskFactors: [{ factor: "Login from new device", points: 15 }, { factor: "Also a new IP", points: 15 }],
    mitreTechniqueId: "T1078",
    mitreTechniqueName: "Valid Accounts",
    evidence: [newDeviceEvent._id],
    correlationKey: `NEW_DEVICE:${victim.username}:seed`,
  });

  await Notification.insertMany([
    {
      audienceRoles: ["ADMIN", "SECURITY_ANALYST"],
      title: "HIGH - Password Spray Detected",
      message: sprayAlert.description,
      severity: "HIGH",
      relatedAlert: sprayAlert._id,
      isRead: true,
    },
    {
      audienceRoles: ["ADMIN", "SECURITY_ANALYST"],
      title: "MEDIUM - New Device Login Detected",
      message: `${victim.username} logged in from a previously unseen device.`,
      severity: "MEDIUM",
      isRead: false,
    },
  ]);

  await AuditLog.insertMany([
    { actor: analyst._id, actorUsername: analyst.username, action: "ALERT_STATUS_CHANGED", target: sprayAlert.alertId, targetType: "Alert", description: "Marked TRUE_POSITIVE", ip: "127.0.0.1", timestamp: hoursAgo(5) },
    { actor: analyst._id, actorUsername: analyst.username, action: "ALERT_STATUS_CHANGED", target: fpAlert.alertId, targetType: "Alert", description: "Marked FALSE_POSITIVE - known admin activity", ip: "127.0.0.1", timestamp: hoursAgo(19) },
    { actor: admin._id, actorUsername: admin.username, action: "USER_CREATED", target: victim.username, targetType: "User", description: "Seed data", ip: "127.0.0.1", timestamp: daysAgo(13) },
  ]);

  console.log("\nSeed complete.");
  console.log("-----------------------------------------");
  console.log("Demo credentials (password for all: Passw0rd!)");
  seedUsersSpec.forEach((u) => console.log(`  ${u.role.padEnd(17)} ${u.username} / ${u.email}`));
  console.log("-----------------------------------------\n");

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
