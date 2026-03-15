const express = require("express");
const router = express.Router();
const { createClass, getAllClasses, getTrainerClasses, updateClass } = require("../controllers/classController");
const { protect } = require("../middleware/authMiddleware");

router.post("/create", protect, createClass);
router.get("/all", getAllClasses);
router.get("/trainer", protect, getTrainerClasses);
router.put("/update/:id", protect, updateClass);

module.exports = router;
