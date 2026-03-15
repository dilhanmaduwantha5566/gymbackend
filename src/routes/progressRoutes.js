const express = require("express");

const router = express.Router();

const {
    addProgress,
    getProgressHistory,
    getAllMembersProgress
} = require("../controllers/progressController");

const { protect } = require("../middleware/authMiddleware");


// Member adds progress
router.post("/add", protect, addProgress);


// Member sees own progress history
router.get("/history", protect, getProgressHistory);


// Trainer sees all members progress
router.get("/all", protect, getAllMembersProgress);


module.exports = router;
