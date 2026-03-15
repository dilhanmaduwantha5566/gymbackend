const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
    {
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
            required: true,
        },
        weight: {
            type: Number,
            required: true,
        },
        height: {
            type: Number, // Stored in CM
            required: true,
        },
        bmi: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Progress", progressSchema);
