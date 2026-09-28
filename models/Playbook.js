import mongoose from "mongoose";
const { Schema } = mongoose;

const PlaybookSchema = new Schema(
  {
    detectionType: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    steps: { type: [String], required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Playbook || mongoose.model("Playbook", PlaybookSchema);
