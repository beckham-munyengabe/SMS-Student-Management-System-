const express = require('express');
const router = express.Router();
const Marks = require('../models/Marks');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/marks
// @desc    Get marks
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { studentId, subject, examType, term } = req.query;
    const query = {};

    // Students can only see their own marks
    if (req.user.role === 'student') {
      query.studentId = req.user.studentId;
    } else {
      if (studentId) query.studentId = studentId;
    }

    if (subject) query.subject = subject;
    if (examType) query.examType = examType;
    if (term) query.term = term;

    const marks = await Marks.find(query)
      .populate('studentId', 'studentName class gender')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/marks/report/:studentId
// @desc    Get full marks report for a student
// @access  Private
router.get('/report/:studentId', async (req, res) => {
  try {
    if (req.user.role === 'student' && req.user.studentId?.toString() !== req.params.studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const marks = await Marks.find({ studentId: req.params.studentId })
      .populate('recordedBy', 'name')
      .sort({ subject: 1, createdAt: -1 });

    // Group by subject
    const bySubject = {};
    marks.forEach(m => {
      if (!bySubject[m.subject]) bySubject[m.subject] = [];
      bySubject[m.subject].push(m);
    });

    const subjectSummaries = Object.entries(bySubject).map(([subject, mList]) => ({
      subject,
      records: mList,
      average: (mList.reduce((s, m) => s + m.marks, 0) / mList.length).toFixed(1),
      highest: Math.max(...mList.map(m => m.marks)),
      lowest: Math.min(...mList.map(m => m.marks))
    }));

    const overallAvg = marks.length > 0
      ? (marks.reduce((s, m) => s + m.marks, 0) / marks.length).toFixed(1)
      : 0;

    res.json({ marks, subjectSummaries, overallAverage: overallAvg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/marks
// @desc    Add marks
// @access  Private/Admin, Teacher
router.post('/', authorize('administrator', 'teacher'), async (req, res) => {
  try {
    const markData = { ...req.body, recordedBy: req.user._id };
    const mark = await Marks.create(markData);
    await mark.populate('studentId', 'studentName class');
    res.status(201).json(mark);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/marks/bulk
// @desc    Add marks in bulk
// @access  Private/Admin, Teacher
router.post('/bulk', authorize('administrator', 'teacher'), async (req, res) => {
  try {
    const { records } = req.body;
    const marksData = records.map(r => ({ ...r, recordedBy: req.user._id }));
    const result = await Marks.insertMany(marksData);
    res.status(201).json({ message: `${result.length} marks recorded`, count: result.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/marks/:id
// @desc    Update marks
// @access  Private/Admin, Teacher
router.put('/:id', authorize('administrator', 'teacher'), async (req, res) => {
  try {
    const mark = await Marks.findByIdAndUpdate(
      req.params.id,
      { ...req.body, recordedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('studentId', 'studentName class');

    if (!mark) {
      return res.status(404).json({ message: 'Marks record not found' });
    }

    res.json(mark);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/marks/:id
// @desc    Delete marks
// @access  Private/Admin
router.delete('/:id', authorize('administrator'), async (req, res) => {
  try {
    const mark = await Marks.findByIdAndDelete(req.params.id);

    if (!mark) {
      return res.status(404).json({ message: 'Marks record not found' });
    }

    res.json({ message: 'Marks record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
