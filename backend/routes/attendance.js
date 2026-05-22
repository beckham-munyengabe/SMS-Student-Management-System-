const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { studentId, date, startDate, endDate, class: cls, subject } = req.query;
    const query = {};

    // Students can only see their own attendance
    if (req.user.role === 'student') {
      query.studentId = req.user.studentId;
    } else {
      if (studentId) query.studentId = studentId;
    }

    if (date) {
      const d = new Date(date);
      query.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (cls) query.class = cls;
    if (subject) query.subject = subject;

    const attendance = await Attendance.find(query)
      .populate('studentId', 'studentName class gender')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/attendance/summary/:studentId
// @desc    Get attendance summary for a student
// @access  Private
router.get('/summary/:studentId', async (req, res) => {
  try {
    // Students can only see their own data
    if (req.user.role === 'student' && req.user.studentId?.toString() !== req.params.studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const records = await Attendance.find({ studentId: req.params.studentId });

    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      late: records.filter(r => r.status === 'Late').length,
      excused: records.filter(r => r.status === 'Excused').length,
    };
    summary.rate = summary.total > 0
      ? ((summary.present / summary.total) * 100).toFixed(1)
      : 0;

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/attendance
// @desc    Record attendance (bulk or single)
// @access  Private/Admin, Teacher
router.post('/', authorize('administrator', 'teacher'), async (req, res) => {
  try {
    const { records } = req.body; // Array of {studentId, date, status, subject, class, notes}

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Records array is required' });
    }

    const attendanceRecords = records.map(r => ({
      ...r,
      recordedBy: req.user._id
    }));

    // Use bulkWrite to handle duplicates gracefully
    const ops = attendanceRecords.map(record => ({
      updateOne: {
        filter: {
          studentId: record.studentId,
          date: {
            $gte: new Date(new Date(record.date).setHours(0,0,0,0)),
            $lte: new Date(new Date(record.date).setHours(23,59,59,999))
          },
          subject: record.subject
        },
        update: { $set: record },
        upsert: true
      }
    }));

    const result = await Attendance.bulkWrite(ops);
    res.status(201).json({ message: 'Attendance recorded successfully', result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update an attendance record
// @access  Private/Admin, Teacher
router.put('/:id', authorize('administrator', 'teacher'), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { ...req.body, recordedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('studentId', 'studentName class');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete an attendance record
// @access  Private/Admin
router.delete('/:id', authorize('administrator'), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
