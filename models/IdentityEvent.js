import mongoose from "mongoose";

const { Schema } = mongoose;

export const EVENT_TYPES = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "LOGOUT",
  "MFA_RESET",
  "MFA_REGISTERED",
  "PASSWORD_CHANGED",
  "ROLE_CHANGED",
  "PRIVILEGE_ESCALATED",
  "NEW_DEVICE",
  "NEW_IP",
  "NEW_LOCATION",
  "ADMIN_LOGIN",
  "OFF_HOURS_LOGIN",
  "ACCOUNT_LOCKED",
  "ACCOUNT_UNLOCKED",
  "API_KEY_CREATED",
  "API_KEY_REVOKED",
  "SESSION_CREATED",
  "SESSION_TERMINATED",
];

const IdentityEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    username: { type: String, index: true },
    eventType: { type: String, enum: EVENT_TYPES, required: true, index: true },
    result: { type: String, enum: ["SUCCESS", "FAILED", "INFO"], default: "INFO" },
    failureReason: { type: String, default: null },
    sourceIP: { type: String, index: true },
    country: { type: String, default: "Pakistan" },
    city: { type: String, default: "Peshawar" },
    device: { type: String, default: "Unknown Device" },
    browser: { type: String, default: "Unknown Browser" },
    operatingSystem: { type: String, default: "Unknown OS" },
    userAgent: { type: String, default: "" },
    previousRole: { type: String, default: null },
    newRole: { type: String, default: null },
    riskScore: { type: Number, default: 0 },
    // freeform bag for simulation tags, correlation ids, etc.
    metadata: { type: Schema.Types.Mixed, default: {} },
    // tags the attack simulator stamps on generated events so the detection
    // engine (and analysts) can tell simulated traffic apart from seed data
    simulation: {
      isSimulated: { type: Boolean, default: false },
      scenario: { type: String, default: null },
      batchId: { type: String, default: null },
    },
  },
  { timestamps: true }
);

IdentityEventSchema.index({ sourceIP: 1, timestamp: -1 });
IdentityEventSchema.index({ eventType: 1, timestamp: -1 });
IdentityEventSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.models.IdentityEvent ||
  mongoose.model("IdentityEvent", IdentityEventSchema);
