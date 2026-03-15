const Booking = require("../models/Booking");
const Class = require("../models/Class");

// Book a class
const bookClass = async (req, res) => {
    try {
        const { classId, paymentIntentId, amount } = req.body;

        // Check if already booked
        const existing = await Booking.findOne({ member: req.user.id, classId, status: "confirmed" });
        if (existing) return res.status(400).json({ message: "Already booked this class" });

        const booking = new Booking({
            member: req.user.id,
            classId,
            paymentStatus: paymentIntentId ? 'paid' : 'pending',
            paymentIntentId: paymentIntentId,
            paymentAmount: amount
        });
        await booking.save();

        // Add to class attendees
        await Class.findByIdAndUpdate(classId, { $push: { attendees: req.user.id } });

        res.status(201).json({ message: "Class booked successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error booking class", error: err.message });
    }
};

// Get my bookings
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ member: req.user.id })
            .populate({
                path: 'classId',
                populate: { path: 'trainer', select: 'name' }
            });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: "Error fetching bookings", error: err.message });
    }
};

// Cancel booking
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId);

        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.member.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

        booking.status = "cancelled";
        await booking.save();

        // Remove from attendees
        await Class.findByIdAndUpdate(booking.classId, { $pull: { attendees: req.user.id } });

        res.json({ message: "Booking cancelled" });
    } catch (err) {
        res.status(500).json({ message: "Error cancelling booking", error: err.message });
    }
}

module.exports = { bookClass, getMyBookings, cancelBooking };
