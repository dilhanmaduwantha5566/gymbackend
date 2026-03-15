const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    isApproved: {
      type: Boolean,
      default: false,   // ❗ NOT approved at register
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

module.exports = mongoose.model("Member", memberSchema);
