const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', authorize('administrator'), async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .populate('studentId', 'studentName class')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({ users, total, pages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users/teachers
// @desc    Get all teachers
// @access  Private/Admin
router.get('/teachers', authorize('administrator'), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isActive: true })
      .select('name email createdAt');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/users
// @desc    Create a new user (admin only)
// @access  Private/Admin
router.post('/', authorize('administrator'), async (req, res) => {
  try {
    const { name, email, password, role, studentId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({ name, email, password, role, studentId });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private/Admin
router.put('/:id', authorize('administrator'), async (req, res) => {
  try {
    const { name, email, role, isActive, studentId } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive, studentId },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/:id', authorize('administrator'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change password (self)
// @access  Private
router.put('/me/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
