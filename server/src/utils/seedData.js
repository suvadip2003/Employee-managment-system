require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding...");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const addMinutes = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});

    console.log("Cleared existing data.");

    // Create HR user
    const hrUser = await User.create({
      firstName: "Sara",
      lastName: "Mallik",
      email: "hr@company.com",
      password: "hr123456",
      role: "hr",
      department: "Human Resources",
      position: "HR Manager",
      employeeId: "HR0001",
      joinDate: new Date("2020-01-15"),
      leaveBalance: 20,
    });

    // Create employees
    const employeesData = [
      {
        firstName: "Jakir",
        lastName: "Doloi",
        email: "jakir.doloi@company.com",
        password: "emp123456",
        department: "Engineering",
        position: "Software Developer",
        employeeId: "EMP0001",
        phone: "+915559873695",
        joinDate: new Date("2021-03-10"),
      },
      {
        firstName: "Ram",
        lastName: "Mondal",
        email: "ram.mondal@company.com",
        password: "emp123456",
        department: "Marketing",
        position: "Marketing Specialist",
        employeeId: "EMP0002",
        phone: "+915559873694",
        joinDate: new Date("2022-06-15"),
      },
      {
        firstName: "Babin",
        lastName: "Ghosh",
        email: "babin.ghosh@company.com",
        password: "emp123456",
        department: "Finance",
        position: "Financial Analyst",
        employeeId: "EMP0003",
        phone: "+915559873693",
        joinDate: new Date("2023-09-20"),
      },
      {
        firstName: "Aahan",
        lastName: "Sarkar",
        email: "aahan.sarkar@company.com",
        password: "emp123456",
        department: "Engineering",
        position: "Frontend Developer",
        employeeId: "EMP0004",
        phone: "+915559873692",
        joinDate: new Date("2022-01-05"),
      },
      {
        firstName: "Chaiti",
        lastName: "Desanth",
        email: "chaiti.desanth@company.com",
        password: "emp123456",
        department: "Operations",
        position: "Operations Manager",
        employeeId: "EMP0005",
        phone: "+915559873691",
        joinDate: new Date("2019-11-12"),
      },
    ];

    const employees = [];

    for (const employeeData of employeesData) {
      const employee = await User.create({
        ...employeeData,
        role: "employee",
      });

      employees.push(employee);
    }

    console.log("Created HR user and 5 employees.");

    // Create attendance records for the past 30 days
    const now = new Date();
    const attendanceRecords = [];

    for (const employee of employees) {
      for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
        const day = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - daysAgo
        );

        const dayOfWeek = day.getDay();

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue;
        }

        // Skip today for most employees
        if (daysAgo === 0 && Math.random() > 0.3) {
          continue;
        }

        // 15% chance of absence
        if (Math.random() < 0.15) {
          attendanceRecords.push({
            employee: employee._id,
            date: new Date(
              day.getFullYear(),
              day.getMonth(),
              day.getDate()
            ),
            status: "absent",
            workingMinutes: 0,
          });

          continue;
        }

        // Check-in between 8:00 AM and 9:30 AM
        const checkInHour = getRandomInt(8, 9);

        const checkInMinute =
          checkInHour === 9
            ? getRandomInt(0, 30)
            : getRandomInt(0, 59);

        const checkIn = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          checkInHour,
          checkInMinute
        );

        const nineAM = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          9,
          0
        );

        const isLate = checkIn > nineAM;

        // 10% chance of no check-out
        const hasCheckOut = Math.random() > 0.1;

        let checkOut = null;
        let workingMinutes = 0;

        if (hasCheckOut) {
          // Work between 7 and 9 hours
          const workHours = getRandomInt(7, 9);
          const workMinutes = getRandomInt(0, 59);

          workingMinutes = workHours * 60 + workMinutes;

          checkOut = addMinutes(checkIn, workingMinutes);
        }

        let status = isLate ? "late" : "present";

        if (hasCheckOut && workingMinutes < 240) {
          status = "half-day";
        }

        attendanceRecords.push({
          employee: employee._id,
          date: new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate()
          ),
          checkIn,
          checkOut: checkOut || undefined,
          workingMinutes,
          status,
        });
      }
    }

    // Insert attendance records
    try {
      await Attendance.insertMany(attendanceRecords, {
        ordered: false,
      });
    } catch (error) {
      // Ignore duplicate key errors
      const hasNonDuplicateError =
        error.code !== 11000 &&
        (!error.writeErrors ||
          error.writeErrors.some(
            (writeError) => writeError.code !== 11000
          ));

      if (hasNonDuplicateError) {
        console.error(
          "Attendance insert error:",
          error.message
        );
      }
    }

    console.log(
      `Created approximately ${attendanceRecords.length} attendance records.`
    );

    // Create leave requests
    const leaveRequests = [
      {
        employee: employees[0]._id,
        leaveType: "annual",
        startDate: new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          10
        ),
        endDate: new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          12
        ),
        totalDays: 3,
        reason: "Family vacation",
        status: "approved",
        reviewedBy: hrUser._id,
        reviewedAt: new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          8
        ),
        reviewNotes: "Approved. Enjoy your vacation!",
        leaveDeducted: true,
      },

      {
        employee: employees[1]._id,
        leaveType: "sick",
        startDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 5
        ),
        endDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 4
        ),
        totalDays: 2,
        reason: "Feeling unwell, doctor appointment",
        status: "approved",
        reviewedBy: hrUser._id,
        reviewedAt: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 6
        ),
        reviewNotes: "Get well soon.",
        leaveDeducted: true,
      },

      {
        employee: employees[2]._id,
        leaveType: "personal",
        startDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 5
        ),
        endDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 6
        ),
        totalDays: 2,
        reason: "Personal matters to attend to",
        status: "pending",
      },

      {
        employee: employees[3]._id,
        leaveType: "annual",
        startDate: new Date(
          now.getFullYear(),
          now.getMonth() - 2,
          20
        ),
        endDate: new Date(
          now.getFullYear(),
          now.getMonth() - 2,
          21
        ),
        totalDays: 2,
        reason: "Short break",
        status: "rejected",
        reviewedBy: hrUser._id,
        reviewedAt: new Date(
          now.getFullYear(),
          now.getMonth() - 2,
          18
        ),
        reviewNotes:
          "Not approved due to project deadline.",
        leaveDeducted: false,
      },

      {
        employee: employees[4]._id,
        leaveType: "annual",
        startDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 10
        ),
        endDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 14
        ),
        totalDays: 5,
        reason: "Annual family trip",
        status: "pending",
      },

      {
        employee: employees[0]._id,
        leaveType: "sick",
        startDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 10
        ),
        endDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 10
        ),
        totalDays: 1,
        reason: "Fever and headache",
        status: "approved",
        reviewedBy: hrUser._id,
        reviewedAt: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 11
        ),
        reviewNotes: "Approved.",
        leaveDeducted: true,
      },
    ];

    await Leave.insertMany(leaveRequests);

    console.log("Created leave requests.");

    // Update leave balances for approved leaves
    await User.findByIdAndUpdate(employees[0]._id, {
      leaveBalance: 16,
    });

    await User.findByIdAndUpdate(employees[1]._id, {
      leaveBalance: 18,
    });

    console.log("");
    console.log("========================================");
    console.log("       SEED DATA COMPLETE");
    console.log("========================================");

    console.log("");
    console.log("HR Account:");
    console.log("Email    : hr@company.com");
    console.log("Password : hr123456");

    console.log("");
    console.log(
      "Employee Accounts (all use password: emp123456):"
    );
    console.log(
      "jakir.doloi@company.com      - Jakir Doloi (Engineering)"
    );
    console.log(
      "ram.mondal@company.com    - Ram Mondal (Marketing)"
    );
    console.log(
      "babin.ghosh@company.com    - Babin Ghosh (Finance)"
    );
    console.log(
      "aahan.sarkar@company.com   - Aahan Sarkar (Engineering)"
    );
    console.log(
      "chaiti.desanth@company.com - Chaiti Desanth (Operations)"
    );

    console.log("");
    console.log("========================================");
    console.log("");

    await mongoose.disconnect();

    console.log("MongoDB disconnected. Seed complete!");
  } catch (error) {
    console.error("Seed error:", error.message);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    process.exit(1);
  }
};

seedData();