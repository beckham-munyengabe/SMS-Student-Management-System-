const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [0, 'Marks cannot be negative'],
    max: [100, 'Marks cannot exceed 100']
  },
  maxMarks: {
    type: Number,
    default: 100
  },
  examType: {
    type: String,
    enum: ['Quiz', 'Midterm', 'Final', 'Assignment', 'Project'],
    default: 'Final'
  },
  term: {
    type: String,
    trim: true
  },
  academicYear: {
    type: String,
    trim: true
  },
  grade: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Auto-calculate grade before saving
marksSchema.pre('save', function (next) {
  const percentage = (this.marks / this.maxMarks) * 100;
  if (percentage >= 90) this.grade = 'A+';
  else if (percentage >= 80) this.grade = 'A';
  else if (percentage >= 70) this.grade = 'B';
  else if (percentage >= 60) this.grade = 'C';
  else if (percentage >= 50) this.grade = 'D';
  else this.grade = 'F';
  next();
});

module.exports = mongoose.model('Marks', marksSchema);
