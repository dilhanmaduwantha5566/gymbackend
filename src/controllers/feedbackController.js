const Feedback = require("../models/Feedback");

// Add new feedback
exports.addFeedback = async (req, res) => {
  try {
    const { memberName, rating, review, progress } = req.body;

    if (!memberName || !memberName.trim()) {
      return res.status(400).json({ message: "Member name is required" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be 1-5" });
    }

    if (!review || !review.trim()) {
      return res.status(400).json({ message: "Review is required" });
    }

    const feedback = new Feedback({ memberName, rating, review, progress });
    await feedback.save();

    res.status(201).json({ message: "Feedback submitted!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all feedback
exports.getFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};