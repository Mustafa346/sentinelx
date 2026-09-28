import mongoose from "mongoose";

const { Schema } = mongoose;

const AlertSchema = new Schema(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"],
      required: true,
      index: true,
    },
    detectionRule: { type: Schema.Types.ObjectId, ref: "DetectionRule", required: true },
    detectionType: { type: String, required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    username: { type: String, default: null },
    sourceIP: { type: String, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ["NEW", "IN_REVIEW", "INVESTIGATING", "TRUE_POSITIVE", "FALSE_POSITIVE", "RESOLVED", "CLOSED"],
      default: "NEW",
      index: true,
    },
    assignedAnalyst: { type: Schema.Types.ObjectId, ref: "User", default: null },
    riskScore: { type: Number, default: 0 },
    riskFactors: [{ factor: String, points: Number }],
    mitreTechniqueId: { type: String },
    mitreTechniqueName: { type: String },
    // evidence: references to the identity events that support this alert
    evidence: [{ type: Schema.Types.ObjectId, ref: "IdentityEvent" }],
    investigationNotes: [
      {
        author: { type: Schema.Types.ObjectId, ref: "User" },
        note: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    falsePositiveReason: { type: String, default: null },
    // used to de-duplicate: same rule + same primary entity (user or IP) within window
    correlationKey: { type: String, index: true },
    simulation: {
      isSimulated: { type: Boolean, default: false },
      scenario: { type: String, default: null },
      batchId: { type: String, default: null },
    },
  },
  { timestamps: true }
);

AlertSchema.index({ severity: 1, status: 1, createdAt: -1 });

export default mongoose.models.Alert || mongoose.model("Alert", AlertSchema);
