const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.post('/checkin', protect, authorize('employee'), checkIn);
router.put('/checkout', protect, authorize('employee'), checkOut);
router.get('/my', protect, getMyAttendance);
router.get('/today', protect, getTodayAttendance);

module.exports = router;
