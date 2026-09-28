import mongoose from "mongoose";

const { Schema } = mongoose;

export const DETECTION_TYPES = [
  "PASSWORD_SPRAY",
  "MFA_ABUSE",
  "PRIVILEGE_ESCALATION",
  "UNUSUAL_ADMIN_LOGIN",
  "IMPOSSIBLE_TRAVEL",
  "NEW_DEVICE",
  "ACCOUNT_TAKEOVER",
];

const DetectionRuleSchema = new Schema(
  {
    ruleId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    detectionType: { type: String, enum: DETECTION_TYPES, required: true, index: true },
    severity: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"],
      required: true,
    },
    status: { type: String, enum: ["ENABLED", "DISABLED"], default: "ENABLED" },
    // generic configurable knobs; not every rule uses every field
    threshold: { type: Number, default: null }, // e.g. failed attempts required
    distinctUserThreshold: { type: Number, default: null }, // e.g. distinct users for spray
    timeWindowMinutes: { type: Number, default: 5 },
    mitreTechniqueId: { type: String, required: true },
    mitreTechniqueName: { type: String, required: true },
    mitreTactic: { type: String, required: true },
    logicDescription: { type: String, required: true },
    exclusions: [
      {
        sourceIP: { type: String, default: null },
        username: { type: String, default: null },
        startHour: { type: Number, default: null },
        endHour: { type: Number, default: null },
        reason: { type: String, default: "" },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    history: [
      {
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        change: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.DetectionRule ||
  mongoose.model("DetectionRule", DetectionRuleSchema);
