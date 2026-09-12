const express = require('express');
const router = express.Router();
const {
  createLeave,
  getMyLeaves,
  getLeaveBalance,
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('employee'), createLeave);
router.get('/my', protect, getMyLeaves);
router.get('/balance', protect, getLeaveBalance);

module.exports = router;
