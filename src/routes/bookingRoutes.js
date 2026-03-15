const express = require("express");
const router = express.Router();
const { bookClass, getMyBookings, cancelBooking } = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

router.post("/book", protect, bookClass);
router.get("/my-bookings", protect, getMyBookings);
router.delete("/cancel/:bookingId", protect, cancelBooking);

module.exports = router;
