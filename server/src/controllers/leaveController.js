const Leave = require('../models/Leave');
const User = require('../models/User');

// @desc    Create leave request
// @route   POST /api/leave
// @access  Private (employee)
const createLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }

    const totalDays =
      Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance (only for non-unpaid leaves)
    if (leaveType !== 'unpaid') {
      const user = await User.findById(req.user._id);
      if (user.leaveBalance < totalDays) {
        return res.status(400).json({
          message: `Insufficient leave balance. You have ${user.leaveBalance} days remaining but requested ${totalDays} days.`,
        });
      }
    }

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
    });

    await leave.populate('employee', 'firstName lastName email employeeId department');

    res.status(201).json({ message: 'Leave request submitted successfully', leave });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my leave requests
// @route   GET /api/leave/my
// @access  Private
const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id })
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ leaves });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my leave balance
// @route   GET /api/leave/balance
// @access  Private
const getLeaveBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ leaveBalance: user.leaveBalance });
  } catch (error) {
    next(error);
  }
};

module.exports = { createLeave, getMyLeaves, getLeaveBalance };
