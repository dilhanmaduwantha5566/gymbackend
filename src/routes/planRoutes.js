const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public route to get all plans
router.get('/', planController.getAllPlans);

// Admin route to seed initial plans
router.post('/seed', protect, adminOnly, planController.seedPlans);

// Admin route to update a specific plan
router.put('/:id', protect, adminOnly, planController.updatePlan);

module.exports = router;
