const Attendance = require('../models/Attendance');

// Helper: get start and end of today (date only, no time)
const getTodayRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
};

// @desc    Check in for today
// @route   POST /api/attendance/checkin
// @access  Private (employee)
const checkIn = async (req, res, next) => {
  try {
    const { start, end } = getTodayRange();

    // Check if already checked in today
    const existing = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: start, $lte: end },
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already checked in today' });
    }

    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Determine status: late if after 9:00 AM
    const nineAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    const status = now > nineAM ? 'late' : 'present';

    const attendance = await Attendance.create({
      employee: req.user._id,
      date: todayDate,
      checkIn: now,
      status,
      notes: req.body.notes || '',
    });

    res.status(201).json({ message: 'Checked in successfully', attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Check out for today
// @route   PUT /api/attendance/checkout
// @access  Private (employee)
const checkOut = async (req, res, next) => {
  try {
    const { start, end } = getTodayRange();

    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: start, $lte: end },
    });

    if (!attendance) {
      return res.status(400).json({ message: 'You have not checked in today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'You have already checked out today' });
    }

    const now = new Date();
    const workingMinutes = Math.round(
      (now - attendance.checkIn) / (1000 * 60)
    );

    // Update status to half-day if working less than 4 hours
    let status = attendance.status;
    if (workingMinutes < 240 && status !== 'late') {
      status = 'half-day';
    } else if (workingMinutes < 240 && status === 'late') {
      status = 'half-day';
    }

    attendance.checkOut = now;
    attendance.workingMinutes = workingMinutes;
    attendance.status = status;
    await attendance.save();

    res.json({ message: 'Checked out successfully', attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my attendance records
// @route   GET /api/attendance/my
// @access  Private
const getMyAttendance = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { employee: req.user._id };

    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
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

// @desc    Get today's attendance for current user
// @route   GET /api/attendance/today
// @access  Private
const getTodayAttendance = async (req, res, next) => {
  try {
    const { start, end } = getTodayRange();

    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: start, $lte: end },
    });

    res.json({ attendance: attendance || null });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkIn, checkOut, getMyAttendance, getTodayAttendance };
