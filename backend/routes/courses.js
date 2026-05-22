const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/courses
// @desc    Get all courses
// @access  Private
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .populate('teacher', 'name email')
      .sort({ courseName: 1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/courses
// @desc    Create a course
// @access  Private/Admin
router.post('/', authorize('administrator'), async (req, res) => {
  try {
    const course = await Course.create(req.body);
    await course.populate('teacher', 'name email');
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private/Admin
router.put('/:id', authorize('administrator'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('teacher', 'name email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private/Admin
router.delete('/:id', authorize('administrator'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
