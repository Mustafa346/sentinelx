import mongoose from "mongoose";
const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", default: null }, // null = broadcast to analysts/admins
    audienceRoles: { type: [String], default: [] }, // e.g. ["ADMIN","SECURITY_ANALYST"]
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"], default: "INFO" },
    relatedAlert: { type: Schema.Types.ObjectId, ref: "Alert", default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
