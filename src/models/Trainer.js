const mongoose = require("mongoose");

const trainerSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    isApproved: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: String,
    verificationCodeExpires: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trainer", trainerSchema);
