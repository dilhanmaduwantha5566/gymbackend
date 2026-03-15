const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        member: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
        classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
        status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
        paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
        paymentIntentId: { type: String }, // Store Stripe Payment Intent ID
        paymentAmount: { type: Number }, // Store Amount Paid
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
