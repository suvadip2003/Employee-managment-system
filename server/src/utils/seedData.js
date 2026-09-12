require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding...');
};

const getRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const addMinutes = (date, minutes) =>
  new Date(date.getTime() + minutes * 60 * 1000);

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Attendance.deleteMany({});
  await Leave.deleteMany({});
  console.log('Cleared existing data.');

  // Create HR user
  const hrUser = await User.create({
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'hr@company.com',
    password: 'hr123456',
    role: 'hr',
    department: 'Human Resources',
    position: 'HR Manager',
    employeeId: 'HR0001',
    joinDate: new Date('2020-01-15'),
    leaveBalance: 20,
  });

  // Create 5 employees
  const employeesData = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      password: 'emp123456',
      department: 'Engineering',
      position: 'Software Developer',
      employeeId: 'EMP0001',
      phone: '+1-555-0101',
      joinDate: new Date('2021-03-10'),
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@company.com',
      password: 'emp123456',
      department: 'Marketing',
      position: 'Marketing Specialist',
      employeeId: 'EMP0002',
      phone: '+1-555-0102',
      joinDate: new Date('2021-06-15'),
    },
    {
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@company.com',
      password: 'emp123456',
      department: 'Finance',
      position: 'Financial Analyst',
      employeeId: 'EMP0003',
      phone: '+1-555-0103',
      joinDate: new Date('2020-09-20'),
    },
    {
      firstName: 'Alice',
      lastName: 'Brown',
      email: 'alice.brown@company.com',
      password: 'emp123456',
      department: 'Engineering',
      position: 'Frontend Developer',
      employeeId: 'EMP0004',
      phone: '+1-555-0104',
      joinDate: new Date('2022-01-05'),
    },
    {
      firstName: 'Charlie',
      lastName: 'Davis',
      email: 'charlie.davis@company.com',
      password: 'emp123456',
      department: 'Operations',
      position: 'Operations Manager',
      employeeId: 'EMP0005',
      phone: '+1-555-0105',
      joinDate: new Date('2019-11-12'),
    },
  ];

  const employees = [];
  for (const empData of employeesData) {
    const emp = await User.create({ ...empData, role: 'employee' });
    employees.push(emp);
  }

  console.log('Created HR user and 5 employees.');

  // Create attendance records for the past 30 days
  const now = new Date();
  const attendanceRecords = [];

  for (const employee of employees) {
    for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
      const dayOfWeek = day.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // Skip today for most employees to simulate real usage
      if (daysAgo === 0 && Math.random() > 0.3) continue;

      // 15% chance of absence
      if (Math.random() < 0.15) {
        attendanceRecords.push({
          employee: employee._id,
          date: new Date(day.getFullYear(), day.getMonth(), day.getDate()),
          status: 'absent',
          workingMinutes: 0,
        });
        continue;
      }

      // Check-in between 8:00 AM and 9:30 AM
      const checkInHour = getRandomInt(8, 9);
      const checkInMinute = checkInHour === 9 ? getRandomInt(0, 30) : getRandomInt(0, 59);
      const checkIn = new Date(day.getFullYear(), day.getMonth(), day.getDate(), checkInHour, checkInMinute);

      const isLate = checkIn > new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0);

      // 10% chance of no check-out (still working or forgot)
      const hasCheckOut = Math.random() > 0.1;

      let checkOut = null;
      let workingMinutes = 0;

      if (hasCheckOut) {
        // Work between 7 and 9 hours
        const workHours = getRandomInt(7, 9);
        const workMinutes = getRandomInt(0, 59);
        checkOut = addMinutes(checkIn, workHours * 60 + workMinutes);
        workingMinutes = workHours * 60 + workMinutes;
      }

      let status = isLate ? 'late' : 'present';
      if (hasCheckOut && workingMinutes < 240) {
        status = 'half-day';
      }

      attendanceRecords.push({
        employee: employee._id,
        date: new Date(day.getFullYear(), day.getMonth(), day.getDate()),
        checkIn,
        checkOut: checkOut || undefined,
        workingMinutes,
        status,
      });
    }
  }

  // Use insertMany with ordered: false to skip duplicates gracefully
  try {
    await Attendance.insertMany(attendanceRecords, { ordered: false });
  } catch (err) {
    // Ignore duplicate key errors from the unique index
    if (err.code !== 11000 && (!err.writeErrors || err.writeErrors.some(e => e.code !== 11000))) {
      console.error('Attendance insert error:', err.message);
    }
  }
  console.log(`Created ~${attendanceRecords.length} attendance records.`);

  // Create leave requests
  const leaveRequests = [
    {
      employee: employees[0]._id, // John Doe
      leaveType: 'annual',
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 10),
      endDate: new Date(now.getFullYear(), now.getMonth() - 1, 12),
      totalDays: 3,
      reason: 'Family vacation',
      status: 'approved',
      reviewedBy: hrUser._id,
      reviewedAt: new Date(now.getFullYear(), now.getMonth() - 1, 8),
      reviewNotes: 'Approved. Enjoy your vacation!',
      leaveDeducted: true,
    },
    {
      employee: employees[1]._id, // Jane Smith
      leaveType: 'sick',
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4),
      totalDays: 2,
      reason: 'Feeling unwell, doctor appointment',
      status: 'approved',
      reviewedBy: hrUser._id,
      reviewedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
      reviewNotes: 'Get well soon.',
      leaveDeducted: true,
    },
    {
      employee: employees[2]._id, // Bob Wilson
      leaveType: 'personal',
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6),
      totalDays: 2,
      reason: 'Personal matters to attend to',
      status: 'pending',
    },
    {
      employee: employees[3]._id, // Alice Brown
      leaveType: 'annual',
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 20),
      endDate: new Date(now.getFullYear(), now.getMonth() - 2, 21),
      totalDays: 2,
      reason: 'Short break',
      status: 'rejected',
      reviewedBy: hrUser._id,
      reviewedAt: new Date(now.getFullYear(), now.getMonth() - 2, 18),
      reviewNotes: 'Not approved due to project deadline.',
      leaveDeducted: false,
    },
    {
      employee: employees[4]._id, // Charlie Davis
      leaveType: 'annual',
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14),
      totalDays: 5,
      reason: 'Annual family trip',
      status: 'pending',
    },
    {
      employee: employees[0]._id, // John Doe - another leave
      leaveType: 'sick',
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
      totalDays: 1,
      reason: 'Fever and headache',
      status: 'approved',
      reviewedBy: hrUser._id,
      reviewedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 11),
      reviewNotes: 'Approved.',
      leaveDeducted: true,
    },
  ];

  await Leave.insertMany(leaveRequests);
  console.log('Created leave requests.');

  // Update leave balances for approved leaves
  await User.findByIdAndUpdate(employees[0]._id, { leaveBalance: 16 }); // 20 - 3 - 1
  await User.findByIdAndUpdate(employees[1]._id, { leaveBalance: 18 }); // 20 - 2

  console.log('\n========================================');
  console.log('  SEED DATA COMPLETE - CREDENTIALS');
  console.log('========================================');
  console.log('\n  HR Account:');
  console.log('  Email   : hr@company.com');
  console.log('  Password: hr123456');
  console.log('\n  Employee Accounts (all use password: emp123456):');
  console.log('  john.doe@company.com     - John Doe (Engineering)');
  console.log('  jane.smith@company.com   - Jane Smith (Marketing)');
  console.log('  bob.wilson@company.com   - Bob Wilson (Finance)');
  console.log('  alice.brown@company.com  - Alice Brown (Engineering)');
  console.log('  charlie.davis@company.com - Charlie Davis (Operations)');
  console.log('\n========================================\n');

  await mongoose.disconnect();
  console.log('MongoDB disconnected. Seed complete!');
  process.exit(0);
};

seedData().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
