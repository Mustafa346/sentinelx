import mongoose from "mongoose";
const { Schema } = mongoose;

const IncidentReportSchema = new Schema(
  {
    reportId: { type: String, required: true, unique: true },
    alert: { type: Schema.Types.ObjectId, ref: "Alert", required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true }, // frozen copy of alert+evidence+notes at generation time
  },
  { timestamps: true }
);

export default mongoose.models.IncidentReport || mongoose.model("IncidentReport", IncidentReportSchema);
