const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

// @desc    Get all employees
// @route   GET /api/hr/employees
// @access  Private (HR)
const getAllEmployees = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { role: 'employee' };

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
        { employeeId: searchRegex },
      ];
    }

    if (req.query.department) {
      query.department = req.query.department;
    }

    const total = await User.countDocuments(query);
    const employees = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee with attendance summary
// @route   GET /api/hr/employees/:id
// @access  Private (HR)
const getEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get attendance summary for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const attendanceRecords = await Attendance.find({
      employee: req.params.id,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    const presentDays = attendanceRecords.filter((a) =>
      ['present', 'late'].includes(a.status)
    ).length;
    const lateDays = attendanceRecords.filter((a) => a.status === 'late').length;
    const halfDays = attendanceRecords.filter((a) => a.status === 'half-day').length;
    const totalWorkingMinutes = attendanceRecords.reduce(
      (sum, a) => sum + (a.workingMinutes || 0),
      0
    );

    res.json({
      employee,
      attendanceSummary: {
        presentDays,
        lateDays,
        halfDays,
        totalWorkingHours: parseFloat((totalWorkingMinutes / 60).toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendance records
// @route   GET /api/hr/attendance
// @access  Private (HR)
const getAllAttendance = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.employeeId) {
      query.employee = req.query.employeeId;
    }

    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    } else if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.date = { $lte: new Date(req.query.endDate) };
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate('employee', 'firstName lastName email employeeId department')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance statistics
// @route   GET /api/hr/attendance/stats
// @access  Private (HR)
const getAttendanceStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });

    // Today's stats
    const todayRecords = await Attendance.find({
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const presentToday = todayRecords.filter((a) =>
      ['present', 'late'].includes(a.status)
    ).length;
    const lateToday = todayRecords.filter((a) => a.status === 'late').length;
    const absentToday = totalEmployees - presentToday;

    // This month's working hours
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthRecords = await Attendance.find({
      date: { $gte: monthStart, $lte: monthEnd },
      workingMinutes: { $gt: 0 },
    });

    const avgWorkingHours =
      monthRecords.length > 0
        ? parseFloat(
            (
              monthRecords.reduce((sum, r) => sum + r.workingMinutes, 0) /
              monthRecords.length /
              60
            ).toFixed(2)
          )
        : 0;

    // Last 7 days chart data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

      const dayRecords = await Attendance.find({
        date: { $gte: dayStart, $lte: dayEnd },
      });

      const present = dayRecords.filter((a) =>
        ['present', 'late'].includes(a.status)
      ).length;
      const absent = totalEmployees - present;

      last7Days.push({
        date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present,
        absent,
      });
    }

    // Pending leaves count
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

    res.json({
      totalEmployees,
      presentToday,
      absentToday,
      lateToday,
      avgWorkingHours,
      pendingLeaves,
      last7Days,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all leave requests
// @route   GET /api/hr/leaves
// @access  Private (HR)
const getAllLeaves = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.employeeId) {
      query.employee = req.query.employeeId;
    }

    if (req.query.leaveType) {
      query.leaveType = req.query.leaveType;
    }

    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName email employeeId department')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      leaves,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review (approve/reject) leave request
// @route   PUT /api/hr/leaves/:id/review
// @access  Private (HR)
const reviewLeave = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const leave = await Leave.findById(req.params.id).populate('employee');

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const previousStatus = leave.status;

    // If approving a non-unpaid leave, deduct balance (only once)
    if (status === 'approved' && !leave.leaveDeducted && leave.leaveType !== 'unpaid') {
      const employee = await User.findById(leave.employee._id);
      if (employee.leaveBalance < leave.totalDays) {
        return res.status(400).json({
          message: `Employee has insufficient leave balance (${employee.leaveBalance} days available, ${leave.totalDays} required)`,
        });
      }
      employee.leaveBalance -= leave.totalDays;
      await employee.save();
      leave.leaveDeducted = true;
    }

    // If rejecting a previously approved leave, restore balance
    if (
      status === 'rejected' &&
      previousStatus === 'approved' &&
      leave.leaveDeducted &&
      leave.leaveType !== 'unpaid'
    ) {
      const employee = await User.findById(leave.employee._id);
      employee.leaveBalance += leave.totalDays;
      await employee.save();
      leave.leaveDeducted = false;
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewNotes = reviewNotes || '';
    await leave.save();

    await leave.populate('employee', 'firstName lastName email employeeId');
    await leave.populate('reviewedBy', 'firstName lastName');

    res.json({ message: `Leave request ${status}`, leave });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee profile (HR)
// @route   PUT /api/hr/employees/:id
// @access  Private (HR)
const updateEmployee = async (req, res, next) => {
  try {
    const allowedFields = ['department', 'position', 'leaveBalance', 'isActive', 'phone'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const employee = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee updated successfully', employee });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEmployees,
  getEmployee,
  getAllAttendance,
  getAttendanceStats,
  getAllLeaves,
  reviewLeave,
  updateEmployee,
};
