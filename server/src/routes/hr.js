const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployee,
  updateEmployee,
  getAllAttendance,
  getAttendanceStats,
  getAllLeaves,
  reviewLeave,
} = require('../controllers/hrController');
const { protect, authorize } = require('../middleware/auth');

// All HR routes are protected and HR-only
router.use(protect, authorize('hr'));

router.get('/employees', getAllEmployees);
router.get('/employees/:id', getEmployee);
router.put('/employees/:id', updateEmployee);

// Stats must come before :id pattern
router.get('/attendance/stats', getAttendanceStats);
router.get('/attendance', getAllAttendance);

router.get('/leaves', getAllLeaves);
router.put('/leaves/:id/review', reviewLeave);

module.exports = router;
