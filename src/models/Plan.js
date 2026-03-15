const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        desc: { type: String, required: true },
        features: { type: [String], required: true },
        image: { type: String },
        isBestValue: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
