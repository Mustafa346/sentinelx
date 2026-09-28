import mongoose from "mongoose";

const { Schema } = mongoose;

export const ROLES = ["ADMIN", "SECURITY_ANALYST", "EMPLOYEE"];
export const DEPARTMENTS = [
  "IT",
  "Finance",
  "HR",
  "Security",
  "Engineering",
  "Management",
];

const BaselineSchema = new Schema(
  {
    knownIPs: { type: [String], default: [] },
    knownDevices: { type: [String], default: [] },
    knownCountries: { type: [String], default: [] },
    normalLoginHourStart: { type: Number, default: 8 },
    normalLoginHourEnd: { type: Number, default: 18 },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: "EMPLOYEE", index: true },
    department: { type: String, enum: DEPARTMENTS, default: "IT" },
    status: {
      type: String,
      enum: ["ACTIVE", "DISABLED", "LOCKED"],
      default: "ACTIVE",
      index: true,
    },
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    lastLogin: { type: Date, default: null },
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    baseline: { type: BaselineSchema, default: () => ({}) },
    isSeedAccount: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, department: 1 });

// Never leak the password hash by accident
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
