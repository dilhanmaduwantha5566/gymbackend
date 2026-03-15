const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        type: { type: String, required: true },
        trainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
        date: { type: String, required: true }, // Format: YYYY-MM-DD
        time: { type: String, required: true }, // Format: HH:MM
        duration: { type: Number, required: true }, // in minutes
        price: { type: Number, required: true }, // in LKR
        attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Member" }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);
