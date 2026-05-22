const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Marks = require('../models/Marks');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/students
// @desc    Get all students
// @access  Private/Admin, Teacher
router.get('/', authorize('administrator', 'teacher'), async (req, res) => {
  try {
    const { class: studentClass, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (studentClass) query.class = studentClass;
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .sort({ studentName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(query);

    res.json({ students, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/students/classes
// @desc    Get distinct classes
// @access  Private
router.get('/classes', async (req, res) => {
  try {
    const classes = await Student.distinct('class', { isActive: true });
    res.json(classes.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/students/:id
// @desc    Get single student with report
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    // Students can only view their own profile
    if (req.user.role === 'student' && req.user.studentId?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get marks summary
    const marks = await Marks.find({ studentId: req.params.id }).sort({ createdAt: -1 });

    // Get attendance summary
    const attendance = await Attendance.find({ studentId: req.params.id }).sort({ date: -1 });
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'Present').length;
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

    // Compute average marks per subject
    const subjectMap = {};
    marks.forEach(m => {
      if (!subjectMap[m.subject]) subjectMap[m.subject] = [];
      subjectMap[m.subject].push(m.marks);
    });

    const subjectAverages = Object.entries(subjectMap).map(([subject, marksList]) => ({
      subject,
      average: (marksList.reduce((a, b) => a + b, 0) / marksList.length).toFixed(1),
      count: marksList.length
    }));

    res.json({
      student,
      marks,
      attendance: attendance.slice(0, 30),
      report: {
        attendanceRate,
        totalDays,
        presentDays,
        subjectAverages,
        overallAverage: marks.length > 0
          ? (marks.reduce((sum, m) => sum + m.marks, 0) / marks.length).toFixed(1)
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/students
// @desc    Create a student
// @access  Private/Admin
router.post('/', authorize('administrator'), async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/students/:id
// @desc    Update a student
// @access  Private/Admin
router.put('/:id', authorize('administrator'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/students/:id
// @desc    Soft delete a student
// @access  Private/Admin
router.delete('/:id', authorize('administrator'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
