import mongoose from "mongoose";
const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorUsername: { type: String, default: "system" },
    action: { type: String, required: true, index: true },
    target: { type: String, default: null },
    targetType: { type: String, default: null },
    description: { type: String, default: "" },
    ip: { type: String, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
