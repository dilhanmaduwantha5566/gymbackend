// ===============================
// Admin Routes File
// Handles admin-only operations
// ===============================

const express = require("express");
const router = express.Router();

// Import controller functions
const {
  getPendingUsers,
  approveUser,
  getApprovedUsers,
  rejectUser,
  deactivateUser,
  getAllPayments,
  getReports,
  updateAdminProfile,
  updateAdminPassword
} = require("../controllers/adminController");

// Import authentication middleware
const { protect, adminOnly } = require("../middleware/authMiddleware");


// ---------------------------------
// Middleware: Only Admin Access
// ---------------------------------
router.use(protect);      // User must be logged in
router.use(adminOnly);    // User must be admin


// ---------------------------------
// User Management Routes
// ---------------------------------

// GET pending users (Verified but not Approved)
router.get("/pending-users", getPendingUsers);

// GET approved users
router.get("/approved-users", getApprovedUsers);

// POST approve user
router.post("/approve/:role/:id", approveUser);

// DELETE reject user (Permanent Delete)
router.delete("/reject/:role/:id", rejectUser);

// PUT deactivate user (Revoke approval)
router.put("/deactivate/:role/:id", deactivateUser);


// ---------------------------------
// Payment & Report Routes
// ---------------------------------

// GET all payments
router.get("/payments", getAllPayments);

// GET system reports
router.get("/reports", getReports);

// ---------------------------------
// Admin Settings Routes
// ---------------------------------

// PUT update admin profile
router.put("/profile", updateAdminProfile);

// PUT update admin password
router.put("/password", updateAdminPassword);

// Export router
module.exports = router;