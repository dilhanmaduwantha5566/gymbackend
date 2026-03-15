const express = require("express");
const router = express.Router();
const { createPaymentIntent } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// Protect this route so only logged in users can initiate payment
router.post("/create-payment-intent", protect, createPaymentIntent);

module.exports = router;
