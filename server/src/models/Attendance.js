const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  checkIn: {
    type: Date,
  },
  checkOut: {
    type: Date,
  },
  workingMinutes: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late'],
    default: 'present',
  },
  notes: {
    type: String,
  },
});

// Compound unique index: one record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Virtual for working hours
attendanceSchema.virtual('workingHours').get(function () {
  return parseFloat((this.workingMinutes / 60).toFixed(2));
});

attendanceSchema.set('toJSON', {
  virtuals: true,
});

module.exports = mongoose.model('Attendance', attendanceSchema);
