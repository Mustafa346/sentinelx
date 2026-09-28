# SentinelX

### Identity Threat Detection & Response Platform

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/status-internship%20project-informational)

SentinelX is a full-stack, **entirely local and self-contained** identity
threat detection and response platform: a self-built, miniature SIEM/IdTR
stack that authenticates users, generates identity events, runs them
through a homegrown rule-based detection engine, raises and correlates
security alerts, and lets a SOC analyst investigate, tune, and report on
them all without a single external dependency.

It simulates an enterprise identity environment: users authenticate,
identity events are generated and stored in MongoDB, a homegrown detection
engine analyzes those events in real time, security alerts are raised,
SOC analysts investigate and triage them, false-positive noise is tuned
out over time, and professional incident reports are generated as PDFs.

**No external identity provider, SIEM, or paid API is required.** There is
no Active Directory, Azure, Splunk, Sentinel, Wazuh, or Elastic dependency.
Everything runs against a local MongoDB instance.

> **Attack simulations are 100% local.** The Attack Simulator generates
> synthetic identity events and writes them to your own MongoDB database.
> At no point does it send a single packet to any external system, real
> account, or real IP address. Every simulated event is tagged
> `simulation.isSimulated = true` so it's always distinguishable from real
> activity in the UI and database.

---

## Table of Contents

1. [Features](#1-features)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Installation](#4-installation)
5. [Demo Credentials](#5-demo-credentials)
6. [API Overview](#6-api-overview)
7. [Detection Logic](#7-detection-logic)
8. [MITRE ATT&CK Mappings](#8-mitre-attck-mappings)
9. [Attack Simulation](#9-attack-simulation)
10. [False-Positive Tuning Methodology](#10-false-positive-tuning-methodology)
11. [Security Considerations](#11-security-considerations)
12. [Testing](#12-testing)
13. [Future Improvements](#13-future-improvements)

---

## 1. Features

- Full authentication system (register/login/logout, bcrypt hashing, JWT
  session cookies, account lockout, rate limiting) where **every auth
  attempt generates a real identity event**.
- Role-based access control (Admin / Security Analyst / Employee),
  enforced server-side on every API route, not just hidden in the UI.
- 19-type identity event model (logins, MFA activity, role changes,
  new device/IP/location, admin logins, lockouts, etc).
- A modular **detection engine** with 7 detectors: Password Spray, MFA
  Abuse, Privilege Escalation, Unusual Admin Login, Impossible Travel,
  New Device, and Account Takeover (correlation across multiple signals).
- Configurable detection rules (thresholds, time windows, MITRE mapping,
  enable/disable, per-rule exclusions) nothing is hard-coded in the UI.
- An **Attack Simulator** with 8 local-only scenarios that exercise the
  full detection pipeline end-to-end.
- SOC Dashboard with live stats and charts, all computed from MongoDB.
- Alert Investigation page: timeline, evidence, entity info, MITRE
  mapping, risk-score breakdown, investigation notes, and status actions.
- False Positive Tuning page with real noise-reduction metrics calculated
  from actual alert data, plus an exception system the detection engine
  actually respects.
- MITRE ATT&CK mapping page using real, accurate technique IDs.
- Incident Response Playbooks for every detection type.
- One-click PDF incident report generation (client-side, via jsPDF).
- Audit logging of sensitive actions, and an in-app notification system.
- Global search across users, alerts, IPs, events, and detection rules.
- A seed script that populates ~14 days of realistic baseline activity
  plus a handful of pre-triaged true/false-positive alerts, so the
  dashboard is meaningful immediately after install.

---

## 2. Technology Stack

| Layer          | Technology                                          |
|-----------------|------------------------------------------------------|
| Frontend        | Next.js 16 (App Router), React 19, Tailwind CSS 4     |
| Backend         | Next.js Route Handlers (Node.js)                      |
| Database        | MongoDB + Mongoose                                    |
| Auth            | JWT (httpOnly cookie) + bcryptjs                      |
| Charts          | Recharts                                              |
| PDF generation  | jsPDF + jspdf-autotable                               |
| Icons           | lucide-react                                          |

No Docker is required. No paid service is required.

---

## 3. Project Structure

```
/app                    Next.js App Router pages + API routes
  /api                   All REST-style API route handlers
  /dashboard, /alerts,    Protected UI pages (one folder per route)
  /events, /simulator, ...
/components
  /layout                 AppShell, Sidebar, Topbar
  /ui                      Shared presentational components (badges, etc)
  AuthProvider.jsx         Client-side auth/session context
/detection-engine         One file per detector + shared helpers
/lib                       Cross-cutting utilities (db, session, auth guard,
                            rate limiting, risk scoring, password hashing,
                            exclusions logic, PDF generation, default rules)
/models                    Mongoose schemas (User, IdentityEvent, Alert,
                            DetectionRule, AuditLog, Notification,
                            IncidentReport, Playbook)
/services                  Business logic services (event ingestion
                            pipeline, attack simulator, audit logging)
/scripts/seed.mjs          Database seed script
/tests                     Node.js native test suite (node:test)
```

Every top-level folder has its own `README.md` with a closer look at what
lives inside it and how it fits into the rest of the app:
[`app/`](./app/README.md) ·
[`components/`](./components/README.md) ·
[`detection-engine/`](./detection-engine/README.md) ·
[`lib/`](./lib/README.md) ·
[`models/`](./models/README.md) ·
[`services/`](./services/README.md) ·
[`scripts/`](./scripts/README.md) ·
[`tests/`](./tests/README.md) ·
[`public/`](./public/README.md)

---

## 4. Installation

### Prerequisites
- Node.js 18+
- A running MongoDB instance (local `mongod`, Docker, or MongoDB Atlas)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# then edit .env.local:
#   MONGODB_URI  - point this at your local or Atlas MongoDB instance
#   JWT_SECRET   - already pre-filled with a random value; replace it if
#                  you plan to run this anywhere beyond your own machine

# 3. Seed the database (creates demo users, detection rules, playbooks,
#    and ~14 days of realistic baseline identity events)
npm run seed

# 4. Run the app
npm run dev
```

Open http://localhost:3000 you'll land on the login page.

### Re-seeding
`npm run seed` wipes and rebuilds *all* data, including user accounts.
To re-seed events/rules/playbooks **without** touching existing user
accounts, run:

```bash
npm run seed -- --keep-users
```

---

## 5. Demo Credentials

All seeded accounts share the password **`Passw0rd!`**

| Role              | Username   | Email                     |
|--------------------|------------|----------------------------|
| Admin              | `admin`    | admin@sentinelx.local       |
| Security Analyst   | `analyst`  | analyst@sentinelx.local     |
| Employee           | `employee` | employee@sentinelx.local    |
| Employee (svc)     | `service`  | service@sentinelx.local     |

(Plus 8 additional employee/analyst accounts across IT, Finance, HR,
Engineering, and Management departments see `scripts/seed.mjs`.)

---

## 6. API Overview

All responses follow a consistent envelope:
```json
{ "success": true }
{ "success": false, "message": "...", "error": "ERROR_CODE" }
```

| Area              | Endpoints |
|-------------------|-----------|
| Auth              | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Events            | `GET /api/events` (filterable, paginated) |
| Alerts            | `GET /api/alerts`, `GET/PATCH /api/alerts/:id` |
| Detection Rules   | `GET /api/detections`, `PATCH /api/detections/:id` |
| Exceptions        | `GET/POST /api/exceptions` |
| Attack Simulation | `POST /api/simulate/{password-spray, mfa-abuse, privilege-escalation, unusual-admin-login, impossible-travel, new-device, new-ip, account-takeover}` |
| Analytics         | `GET /api/analytics/overview`, `GET /api/analytics/false-positives` |
| MITRE             | `GET /api/mitre` |
| Playbooks         | `GET /api/playbooks` |
| Reports           | `GET/POST /api/reports`, `GET /api/reports/:id` |
| Users (admin)     | `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/:id` |
| Audit Logs (admin)| `GET /api/audit-logs` |
| Notifications     | `GET/PATCH /api/notifications` |
| Search            | `GET /api/search?q=...` |
| Admin/Demo        | `POST /api/admin/generate-demo-attack`, `POST /api/admin/reset-demo` |

Every route enforces role-based authorization **server-side** via
`lib/authGuard.js`'s `requireAuth([...roles])` the frontend hiding a
button is never the only line of defense.

---

## 7. Detection Logic

The detection engine (`/detection-engine`) runs as a pipeline every time a
new identity event is recorded (`services/eventPipeline.js`):

1. Store the event in MongoDB.
2. Run every **enabled** detection rule against it.
3. Each detector queries the relevant recent events (e.g. failed logins
   from the same IP in the last N minutes).
4. Check the rule's configured exclusions (`lib/exclusions.js`) if the
   IP/user/time-window matches an exclusion, the detection is suppressed.
5. If the pattern matches, compute a transparent risk score
   (`lib/riskScoring.js` every point is tied to a named factor, never a
   black box).
6. Create (or correlate into an existing) alert, attach evidence, map to
   MITRE ATT&CK, fire a notification, and write an audit log entry.

### Detectors and default thresholds

| Detector | Logic | Default Threshold | Severity |
|---|---|---|---|
| Password Spray | Failed logins against N distinct users from one IP in a time window | 5 attempts / 3 users / 5 min | HIGH |
| Suspicious MFA Activity | Repeated MFA resets, or reset followed by successful login | 2 resets / 10 min | HIGH |
| Privilege Escalation | Role changed to a more privileged role | / 15 min | CRITICAL (ADMIN) / HIGH |
| Unusual Admin Login | Admin login off-hours, new IP, new device, or new location | | HIGH |
| Impossible Travel | Two successful logins from different countries, too close together | / 30 min | HIGH |
| New Device Login | Login from a device outside the user's baseline | | MEDIUM |
| Account Takeover | 4+ of: new IP, new device, failed logins, successful login, MFA change | 4 signals / 15 min | CRITICAL |

All of these values are configurable per-rule from the **Detection
Rules** page (Admin only) nothing is hard-coded in the frontend.

### Deduplication / correlation
Alerts are deduplicated via a `correlationKey` (e.g.
`PASSWORD_SPRAY:<ip>`). If an open alert already exists for the same key,
new evidence is attached to it instead of creating a duplicate alert
this is what lets you re-run a simulation without flooding the queue.

---

## 8. MITRE ATT&CK Mappings

| Detection | Technique |
|---|---|
| Password Spray | T1110.003 Password Spraying |
| Suspicious MFA Activity | T1621 Multi-Factor Authentication Request Generation |
| Privilege Escalation | T1098 Account Manipulation |
| Unusual Admin Login | T1078.003 Valid Accounts: Local Accounts |
| Impossible Travel | T1078 Valid Accounts |
| New Device Login | T1078 Valid Accounts |
| Account Takeover | T1078 Valid Accounts |

These are real MITRE ATT&CK technique IDs, stored on each `DetectionRule`
document and surfaced on the MITRE page with live alert counts.

---

## 9. Attack Simulation

The Attack Simulator (`/simulator`) generates each of the 8 scenarios
described in the spec by writing realistic `IdentityEvent` documents
through the exact same ingestion pipeline real logins use meaning the
detection engine analyzes simulated traffic exactly as it would real
traffic. Every simulated event and resulting alert is tagged
`simulation.isSimulated: true` with a `batchId`, so you can always tell
synthetic data apart from genuine activity, and clear it independently
(see **Settings → Clear Demo Data**).

---

## 10. False-Positive Tuning Methodology

1. An analyst reviews an alert on the Investigation page and marks it
   **True Positive** or **False Positive** (a reason is required for
   false positives, chosen from a fixed list: known admin activity,
   scheduled maintenance, helpdesk activity, trusted IP, authorized
   device, expected behavior).
2. From the False Positive Tuning page, an analyst can create an
   **exception** on the relevant detection rule e.g. "ignore admin
   logins from 10.0.0.50 between 00:00–03:00."
3. The detection engine checks exceptions on every subsequent evaluation
   (`lib/exclusions.js`), so tuned-out patterns stop generating alerts.
4. The **Detection Quality** section of the False Positive Tuning page
   computes, directly from stored `Alert` documents (never fabricated):
   - Total alerts before tuning
   - Alerts remaining after excluding false positives
   - Noise reduction percentage
   - False-positive rate and precision, both overall and per-rule

---

## 11. Security Considerations

- Passwords are hashed with bcrypt (cost factor 12) never stored or
  logged in plaintext.
- Sessions use httpOnly, sameSite cookies signed with a JWT secret from
  `.env.local` never exposed to client-side JavaScript.
- Every API route re-validates the session against the database (not just
  the JWT payload) and enforces role checks server-side.
- Public self-registration always creates an `EMPLOYEE` account a role
  field in the request body is never trusted for privilege assignment.
- Login and registration endpoints are rate-limited per-IP.
- Accounts lock automatically after 5 failed login attempts (15-minute
  lockout).
- Mongoose schemas validate and constrain all persisted fields; no raw
  user input is interpolated into queries.
- API errors return a generic, consistent envelope no stack traces or
  internal details are ever sent to the client.
- Secrets live only in `.env.local` (gitignored), never in the database
  or source code.

---

## 12. Testing

A Node.js-native test suite (`node:test`, no extra framework needed)
covers pure, side-effect-free logic:

```bash
npm test
```

Covers: risk-score computation and normalization, exclusion/false-positive
matching logic (including overnight time windows), password hashing and
strength validation, and user-agent parsing / off-hours detection.

Detection logic that depends on MongoDB (the full detector pipeline,
alert creation, deduplication) is best verified end-to-end by hand using
the Attack Simulator against a running instance:

1. Log in as `analyst`.
2. Open **Attack Simulator** and run **Password Spray**.
3. Confirm events appear on the **Events** page and an alert appears on
   **Alerts** / the **Dashboard** live feed.
4. Open the alert confirm timeline, evidence, and MITRE mapping.
5. Mark it **False Positive** with a reason, then add an **Exception** on
   the False Positive Tuning page for that IP.
6. Re-run the same simulation confirm the Detection Quality metrics
   update accordingly.
7. Generate a PDF incident report from the alert.
8. Confirm the actions were recorded on the **Audit Logs** page (Admin).

Repeat for the other 6 scenarios.

---

## 13. Future Improvements

- WebSocket/SSE push for the live alert feed instead of polling.
- Configurable business-hours-per-department (currently a per-user
  baseline field, editable via the seed script / API).
- CSV export for alerts/events.
- Multi-alert bulk triage actions.
- A lightweight anomaly-scoring layer on top of the existing rule-based
  engine (kept deliberately simple and transparent per the project
  requirements no black-box ML).

---

## License / Purpose

Built as an internship learning project for an Offensive Security and
Vulnerability Assessment track. Not intended as a production identity
security product.
