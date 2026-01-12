const express = require('express');
const Lesson = require('../models/Lesson');
const StudentProgress = require('../models/StudentProgress');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get lessons
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};

    // Filter by class number if provided
    if (req.query.classNumber) {
      query.class_number = req.query.classNumber;
    }

    // Teachers only see their own lessons
    if (req.user.role === 'teacher') {
      query.teacher_id = req.user._id;
    }
    // Students and admins see all lessons

    const lessons = await Lesson.find(query)
      .populate('teacher_id', 'full_name')
      .sort({ order_index: 1, created_at: -1 });

    // Fetch completion stats for each lesson
    const lessonsWithStats = await Promise.all(lessons.map(async (lesson) => {
      const completionCount = await StudentProgress.countDocuments({
        lesson_id: lesson._id,
        completed: true
      });

      // If we want total students to calculate percentage, we'd need to know the class size.
      // For now, let's just return the completion count.
      return {
        ...lesson.toObject(),
        completionCount
      };
    }));

    res.json(lessonsWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single lesson
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create lesson (teacher/admin)
router.post('/', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const lesson = new Lesson({
      ...req.body,
      teacher_id: req.user._id
    });
    await lesson.save();
    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lesson (teacher/admin)
router.put('/:id', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Teachers can only update their own lessons
    if (req.user.role === 'teacher' && lesson.teacher_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedLesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete lesson (teacher/admin)
router.delete('/:id', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Teachers can only delete their own lessons
    if (req.user.role === 'teacher' && lesson.teacher_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lesson analytics (teacher and admin)
router.get('/:id/analytics', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Teachers can only view analytics for their own lessons (Admins bypass this)
    if (req.user.role === 'teacher' && lesson.teacher_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const progress = await StudentProgress.find({
      lesson_id: req.params.id,
      completed: true
    }).populate('student_id', 'full_name email');

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark lesson as complete (student)
router.post('/:id/complete', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    // Check if already completed to prevent double counting points
    const existingProgress = await StudentProgress.findOne({
      student_id: req.user._id,
      lesson_id: req.params.id,
      completed: true
    });

    if (existingProgress) {
      return res.json(existingProgress);
    }

    const progress = await StudentProgress.findOneAndUpdate(
      { student_id: req.user._id, lesson_id: req.params.id },
      { completed: true, completed_at: Date.now() },
      { upsert: true, new: true }
    );

    // Update student stats with XP
    const StudentStats = require('../models/StudentStats'); // Ensure model is available
    let stats = await StudentStats.findOne({ student_id: req.user._id });

    if (!stats) {
      stats = new StudentStats({
        student_id: req.user._id,
        total_points: 0,
        current_level: 1,
        lessons_completed: 0
      });
    }

    const XP_PER_LESSON = 50;
    stats.total_points += XP_PER_LESSON;
    stats.lessons_completed += 1;
    stats.current_level = Math.max(1, Math.floor(Math.sqrt(stats.total_points / 100)) + 1);
    await stats.save();

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

