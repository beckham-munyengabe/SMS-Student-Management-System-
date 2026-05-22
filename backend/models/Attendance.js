const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Present', 'Absent', 'Late', 'Excused']
  },
  class: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Compound index to prevent duplicate attendance per student per day per subject
attendanceSchema.index({ studentId: 1, date: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
